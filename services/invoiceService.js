const PDFDocument = require("pdfkit");
require("dotenv").config();

async function generateInvoicePDF(orderData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF chunks
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .fillColor("#4CAF50")
        .text(process.env.SHOP_NAME, { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor("#666")
        .text(process.env.SHOP_ADDRESS, { align: "center" })
        .text(
          `Phone: ${process.env.SHOP_PHONE} | Email: ${process.env.SHOP_EMAIL}`,
          { align: "center" },
        )
        .moveDown(1);

      // Line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

      // Invoice title
      doc
        .fontSize(18)
        .fillColor("#000")
        .text("INVOICE", { align: "center" })
        .moveDown(1);

      // Invoice details
      const currentDate = new Date();
      doc.fontSize(11).fillColor("#333");

      doc
        .text(`Invoice Number: ${orderData.orderId}`, 50)
        .text(`Date: ${currentDate.toLocaleDateString()}`, 50)
        .text(`Time: ${currentDate.toLocaleTimeString()}`, 50)
        .text(`Customer Email: ${orderData.email}`, 50)
        .moveDown(1.5);

      // Line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

      // Table header
      const tableTop = doc.y;
      doc
        .fontSize(11)
        .fillColor("#000")
        .text("Item", 50, tableTop, { width: 250 })
        .text("Qty", 310, tableTop, { width: 50 })
        .text("Price", 370, tableTop, { width: 80 })
        .text("Subtotal", 460, tableTop, { width: 90, align: "right" });

      // Line under header
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      // Table items
      let yPosition = tableTop + 30;
      doc.fontSize(10).fillColor("#333");

      orderData.items.forEach((item) => {
        doc
          .text(item.name, 50, yPosition, { width: 250 })
          .text(item.quantity.toString(), 310, yPosition, { width: 50 })
          .text(`$${item.price.toFixed(2)}`, 370, yPosition, { width: 80 })
          .text(`$${item.subtotal.toFixed(2)}`, 460, yPosition, {
            width: 90,
            align: "right",
          });

        yPosition += 25;
      });

      // Line before totals
      yPosition += 10;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

      // Subtotal
      yPosition += 20;
      doc
        .fontSize(11)
        .text("Subtotal:", 370, yPosition)
        .text(`$${orderData.subtotal.toFixed(2)}`, 460, yPosition, {
          width: 90,
          align: "right",
        });

      // Tax (if applicable)
      if (orderData.tax && orderData.tax > 0) {
        yPosition += 20;
        doc
          .text(`Tax (${orderData.taxRate}%):`, 370, yPosition)
          .text(`$${orderData.tax.toFixed(2)}`, 460, yPosition, {
            width: 90,
            align: "right",
          });
      }

      // Total
      yPosition += 25;
      doc
        .fontSize(14)
        .fillColor("#4CAF50")
        .text("TOTAL:", 370, yPosition)
        .text(`$${orderData.totalAmount.toFixed(2)}`, 460, yPosition, {
          width: 90,
          align: "right",
        });

      // Payment instructions
      yPosition += 50;
      doc
        .fontSize(11)
        .fillColor("#333")
        .text("Payment Instructions:", 50, yPosition)
        .fontSize(10)
        .text(
          "Please scan the QR code at the counter to complete your payment.",
          50,
          yPosition + 20,
        )
        .moveDown(2);

      // Footer
      doc
        .fontSize(9)
        .fillColor("#666")
        .text("Thank you for dining with us!", { align: "center" })
        .moveDown(0.5)
        .text(
          "This is a computer-generated invoice and does not require a signature.",
          { align: "center" },
        );

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePDF };
