const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { validateFeedback, sanitizeBody } = require("../middleware/validation");

// Submit feedback
router.post("/", sanitizeBody, validateFeedback, async (req, res) => {
  const { orderId, rating, suggestions } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
  }

  try {
    // Verify order exists
    const [order] = await db.query("SELECT id FROM orders WHERE order_id = ?", [
      orderId,
    ]);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if feedback already exists
    const existingFeedback = await db.query(
      "SELECT id FROM feedback WHERE order_id = ?",
      [order.id],
    );

    if (existingFeedback.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Feedback already submitted for this order",
      });
    }

    // Insert feedback
    await db.query(
      "INSERT INTO feedback (order_id, rating, suggestions) VALUES (?, ?, ?)",
      [order.id, rating || null, suggestions || null],
    );

    res.json({
      success: true,
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
});

// Get feedback for an order (admin use)
router.get("/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const feedback = await db.query(
      `SELECT f.rating, f.suggestions, f.created_at
             FROM feedback f
             JOIN orders o ON f.order_id = o.id
             WHERE o.order_id = ?`,
      [orderId],
    );

    if (feedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No feedback found for this order",
      });
    }

    res.json({
      success: true,
      data: feedback[0],
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
});

module.exports = router;
