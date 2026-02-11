const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");
const { generateInvoicePDF } = require("../services/invoiceService");
const {
  sendInvoiceEmail,
  sendFeedbackEmail,
} = require("../services/emailService");
const {
  validateOrderCreation,
  validateOrderConfirmation,
} = require("../middleware/validation");

// Create new order
router.post("/", async (req, res) => {
  const { userId, email, items } = req.body;

  if (!userId || !email || !items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "User ID, email, and items are required",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verify user exists
    const [user] = await connection.execute(
      "SELECT id FROM users WHERE id = ? AND email = ?",
      [userId, email],
    );

    if (!user) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total and validate items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const [menuItem] = await connection.execute(
        "SELECT id, name, price FROM menu_items WHERE id = ? AND is_available = TRUE",
        [item.menuItemId],
      );

      if (!menuItem) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menuItemId} not found or unavailable`,
        });
      }

      const quantity = item.quantity || 1;
      const subtotal = menuItem.price * quantity;
      totalAmount += subtotal;

      validatedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        subtotal,
      });
    }

    // Create order
    const [orderResult] = await connection.execute(
      "INSERT INTO orders (order_id, user_id, total_amount, status) VALUES (?, ?, ?, ?)",
      [orderId, userId, totalAmount, "PENDING"],
    );

    const orderDbId = orderResult.insertId;

    // Insert order items
    for (const item of validatedItems) {
      await connection.execute(
        "INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?)",
        [orderDbId, item.menuItemId, item.quantity, item.price, item.subtotal],
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId,
        orderDbId,
        totalAmount,
        items: validatedItems,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  } finally {
    connection.release();
  }
});

// Confirm order and send invoice
router.post("/:orderId/confirm", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Get order details
    const [order] = await db.query(
      `SELECT o.id, o.order_id, o.total_amount, o.invoice_sent, u.email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.order_id = ?`,
      [orderId],
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.invoice_sent) {
      return res.status(400).json({
        success: false,
        message: "Invoice already sent for this order",
      });
    }

    // Get order items
    const orderItems = await db.query(
      `SELECT oi.quantity, oi.price, oi.subtotal, mi.name
             FROM order_items oi
             JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = ?`,
      [order.id],
    );

    // Prepare invoice data
    const invoiceData = {
      orderId: order.order_id,
      email: order.email,
      totalAmount: parseFloat(order.total_amount),
      subtotal: parseFloat(order.total_amount),
      tax: 0,
      taxRate: 0,
      items: orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
      })),
    };

    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Send invoice email asynchronously (don't block response)
    sendInvoiceEmail(order.email, invoiceData, pdfBuffer)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log(`Invoice email sent successfully to ${order.email}`);
        } else {
          console.error(
            `Failed to send invoice email to ${order.email}:`,
            emailResult.error,
          );
        }
      })
      .catch((error) => {
        console.error(`Error sending invoice email to ${order.email}:`, error);
      });

    // Update order status immediately without waiting for email
    await db.query(
      "UPDATE orders SET invoice_sent = TRUE, status = ? WHERE id = ?",
      ["CONFIRMED", order.id],
    );

    res.json({
      success: true,
      message: "Order confirmed! Invoice will be sent to your email shortly.",
      data: {
        orderId: order.order_id,
        email: order.email,
      },
    });
  } catch (error) {
    console.error("Confirm order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm order",
    });
  }
});

// Mark order as paid and send feedback form
router.post("/:orderId/paid", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Get order details
    const [order] = await db.query(
      `SELECT o.id, o.order_id, o.status, u.email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.order_id = ?`,
      [orderId],
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [
      "PAID",
      order.id,
    ]);

    // Send feedback email asynchronously (don't block response)
    sendFeedbackEmail(order.email, order.order_id)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log(`Feedback email sent successfully to ${order.email}`);
        } else {
          console.error(`Failed to send feedback email to ${order.email}`);
        }
      })
      .catch((error) => {
        console.error(`Error sending feedback email to ${order.email}:`, error);
      });

    res.json({
      success: true,
      message: "Payment confirmed! Feedback form will be sent to your email.",
      data: {
        orderId: order.order_id,
      },
    });
  } catch (error) {
    console.error("Mark paid error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process payment confirmation",
    });
  }
});

// Get order details
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const [order] = await db.query(
      `SELECT o.id, o.order_id, o.total_amount, o.status, o.created_at, u.email
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.order_id = ?`,
      [orderId],
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderItems = await db.query(
      `SELECT oi.quantity, oi.price, oi.subtotal, mi.name, mi.description
             FROM order_items oi
             JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = ?`,
      [order.id],
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
    });
  }
});

module.exports = router;
