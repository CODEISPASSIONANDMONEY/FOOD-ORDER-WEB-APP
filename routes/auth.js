const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { generateOTP, sendOTPEmail } = require("../services/emailService");
const {
  validateOTPRequest,
  validateOTPVerification,
} = require("../middleware/validation");

// Send OTP to email
router.post("/send-otp", validateOTPRequest, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  try {
    // Generate OTP
    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const otpExpiry = new Date(Date.now() + expiryMinutes * 60000);

    // Check if user exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      // Update existing user
      await db.query(
        "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?",
        [otp, otpExpiry, email],
      );
    } else {
      // Create new user
      await db.query(
        "INSERT INTO users (email, otp, otp_expiry) VALUES (?, ?, ?)",
        [email, otp, otpExpiry],
      );
    }

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent successfully to your email",
      expiryMinutes,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// Verify OTP
router.post("/verify-otp", validateOTPVerification, async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {
    // Get user with OTP
    const users = await db.query(
      "SELECT id, otp, otp_expiry FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Clear OTP after successful verification
    await db.query(
      "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?",
      [user.id],
    );

    res.json({
      success: true,
      message: "OTP verified successfully",
      userId: user.id,
      email,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

module.exports = router;
