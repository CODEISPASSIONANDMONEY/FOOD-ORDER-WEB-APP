const nodemailer = require("nodemailer");
require("dotenv").config();

// Check if in development mode (email not configured or authentication fails)
const isDevelopmentMode =
  !process.env.EMAIL_USER ||
  process.env.EMAIL_USER === "demo@gmail.com" ||
  process.env.EMAIL_USER === "your_email@gmail.com" ||
  process.env.NODE_ENV === "development";

// Create transporter
let transporter = null;
if (!isDevelopmentMode) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } catch (error) {
    console.warn(
      "⚠️ Email transport creation failed. Running in development mode.",
    );
    transporter = null;
  }
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: `"${process.env.SHOP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for Food Ordering",
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
                    .otp-box { background-color: #fff; padding: 20px; text-align: center; font-size: 32px; 
                               font-weight: bold; color: #4CAF50; border: 2px dashed #4CAF50; 
                               border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${process.env.SHOP_NAME}</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to Our Restaurant! 🍽️</h2>
                        <p>Thank you for choosing us. To continue with your order, please use the OTP below:</p>
                        <div class="otp-box">${otp}</div>
                        <p><strong>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES} minutes.</strong></p>
                        <p>If you didn't request this OTP, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>${process.env.SHOP_NAME} | ${process.env.SHOP_ADDRESS}</p>
                        <p>Contact: ${process.env.SHOP_PHONE} | ${process.env.SHOP_EMAIL}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  // Development mode: Log OTP to console instead of sending email
  if (isDevelopmentMode || !transporter) {
    console.log("\n" + "=".repeat(60));
    console.log("📧 DEVELOPMENT MODE - EMAIL NOT SENT");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires in: ${process.env.OTP_EXPIRY_MINUTES} minutes`);
    console.log("=".repeat(60) + "\n");
    return { success: true, devMode: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    // Fall back to dev mode on auth errors
    if (error.code === "EAUTH") {
      console.log("\n" + "=".repeat(60));
      console.log("⚠️ EMAIL AUTH FAILED - FALLING BACK TO DEV MODE");
      console.log("=".repeat(60));
      console.log(`To: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires in: ${process.env.OTP_EXPIRY_MINUTES} minutes`);
      console.log(
        "ℹ️ To fix: Use Gmail App Password instead of regular password",
      );
      console.log(
        "ℹ️ Guide: https://support.google.com/accounts/answer/185833",
      );
      console.log("=".repeat(60) + "\n");
      return { success: true, devMode: true };
    }
    return { success: false, error: error.message };
  }
}

// Send invoice email
async function sendInvoiceEmail(email, orderData, pdfBuffer) {
  const mailOptions = {
    from: `"${process.env.SHOP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order Invoice - ${orderData.orderId}`,
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
                    .order-info { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
                    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
                    .total { font-size: 20px; font-weight: bold; color: #4CAF50; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You for Your Order! 🎉</h1>
                    </div>
                    <div class="content">
                        <h2>Order Confirmed</h2>
                        <div class="order-info">
                            <div class="info-row">
                                <span>Order ID:</span>
                                <strong>${orderData.orderId}</strong>
                            </div>
                            <div class="info-row">
                                <span>Date:</span>
                                <strong>${new Date().toLocaleString()}</strong>
                            </div>
                            <div class="info-row total">
                                <span>Total Amount:</span>
                                <span>$${orderData.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <p>Your detailed invoice is attached to this email.</p>
                        <p><strong>Next Steps:</strong></p>
                        <ol>
                            <li>Please proceed to payment by scanning the QR code in the shop</li>
                            <li>After payment, you'll receive a feedback form via email</li>
                        </ol>
                        <p>Thank you for dining with us! 😊</p>
                    </div>
                    <div class="footer">
                        <p>${process.env.SHOP_NAME} | ${process.env.SHOP_ADDRESS}</p>
                        <p>Contact: ${process.env.SHOP_PHONE} | ${process.env.SHOP_EMAIL}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    attachments: [
      {
        filename: `Invoice-${orderData.orderId}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  // Development mode: Log invoice email to console
  if (isDevelopmentMode || !transporter) {
    console.log("\n" + "=".repeat(60));
    console.log("📧 DEVELOPMENT MODE - INVOICE EMAIL NOT SENT");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Order ID: ${orderData.orderId}`);
    console.log(`Total: $${orderData.totalAmount.toFixed(2)}`);
    console.log("Invoice PDF generated but not sent");
    console.log("=".repeat(60) + "\n");
    return { success: true, devMode: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Invoice email sending failed:", error.message);
    // Don't fail on email errors - just log
    return { success: true, emailFailed: true };
  }
}

// Send feedback form email
async function sendFeedbackEmail(email, orderId) {
  const feedbackLink = `http://localhost:${process.env.PORT}/feedback.html?orderId=${orderId}`;

  const mailOptions = {
    from: `"${process.env.SHOP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "We Value Your Feedback!",
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
                    .button { display: inline-block; padding: 15px 30px; background-color: #4CAF50; 
                             color: white; text-decoration: none; border-radius: 5px; font-weight: bold; 
                             margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Thank You for Your Payment! 💳</h1>
                    </div>
                    <div class="content">
                        <h2>How Was Your Experience?</h2>
                        <p>We hope you enjoyed your meal! Your feedback helps us serve you better.</p>
                        <p>Please take a moment to share your experience with us.</p>
                        <center>
                            <a href="${feedbackLink}" class="button">Share Your Feedback</a>
                        </center>
                        <p>Order ID: <strong>${orderId}</strong></p>
                        <p>Thank you for choosing ${process.env.SHOP_NAME}! We look forward to serving you again! 😊</p>
                    </div>
                    <div class="footer">
                        <p>${process.env.SHOP_NAME} | ${process.env.SHOP_ADDRESS}</p>
                        <p>Contact: ${process.env.SHOP_PHONE} | ${process.env.SHOP_EMAIL}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
  };

  // Development mode: Log feedback email to console
  if (isDevelopmentMode || !transporter) {
    console.log("\n" + "=".repeat(60));
    console.log("📧 DEVELOPMENT MODE - FEEDBACK EMAIL NOT SENT");
    console.log("=".repeat(60));
    console.log(`To: ${email}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Feedback Link: ${feedbackLink}`);
    console.log("=".repeat(60) + "\n");
    return { success: true, devMode: true };
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Feedback email sending failed:", error.message);
    // Don't fail on email errors - just log
    return { success: true, emailFailed: true };
  }
}

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendInvoiceEmail,
  sendFeedbackEmail,
};
