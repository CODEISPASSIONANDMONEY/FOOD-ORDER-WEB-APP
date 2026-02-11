/**
 * Input Validation Middleware
 * Validates and sanitizes user inputs to prevent injection attacks
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  // Remove potential XSS characters
  return str.replace(/[<>]/g, "").trim().substring(0, 1000); // Max length 1000 chars
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

const validateOrderItem = (item) => {
  return (
    item &&
    typeof item.id === "number" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    item.quantity <= 100 // Reasonable max quantity
  );
};

// Middleware: Validate OTP request
const validateOTPRequest = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Sanitize email
  req.body.email = email.toLowerCase().trim();
  next();
};

// Middleware: Validate OTP verification
const validateOTPVerification = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must be a 6-digit number",
    });
  }

  // Sanitize inputs
  req.body.email = email.toLowerCase().trim();
  req.body.otp = otp.trim();
  next();
};

// Middleware: Validate order creation
const validateOrderCreation = (req, res, next) => {
  const { userId, items, totalAmount, customerPhone, customerAddress } =
    req.body;

  const errors = [];

  if (!userId || typeof userId !== "number") {
    errors.push("Valid user ID is required");
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push("Order must contain at least one item");
  } else {
    // Validate each item
    const invalidItems = items.filter((item) => !validateOrderItem(item));
    if (invalidItems.length > 0) {
      errors.push("Invalid order items");
    }
  }

  if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
    errors.push("Valid total amount is required");
  }

  if (customerPhone && !validatePhone(customerPhone)) {
    errors.push("Invalid phone number format");
  }

  if (
    !customerAddress ||
    typeof customerAddress !== "string" ||
    customerAddress.trim().length < 10
  ) {
    errors.push("Valid delivery address is required (minimum 10 characters)");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitize string inputs
  if (customerPhone) req.body.customerPhone = sanitizeString(customerPhone);
  if (customerAddress)
    req.body.customerAddress = sanitizeString(customerAddress);

  next();
};

// Middleware: Validate order confirmation
const validateOrderConfirmation = (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId || !/^[a-zA-Z0-9\-]+$/.test(orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID format",
    });
  }

  next();
};

// Middleware: Validate feedback submission
const validateFeedback = (req, res, next) => {
  const { orderId, rating, comment } = req.body;

  const errors = [];

  if (!orderId || typeof orderId !== "string") {
    errors.push("Valid order ID is required");
  }

  if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
    errors.push("Rating must be between 1 and 5");
  }

  if (comment && typeof comment !== "string") {
    errors.push("Comment must be a string");
  }

  if (comment && comment.length > 1000) {
    errors.push("Comment must not exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Sanitize comment
  if (comment) req.body.comment = sanitizeString(comment);

  next();
};

// Generic sanitization middleware
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  next();
};

module.exports = {
  validateEmail,
  sanitizeString,
  validatePhone,
  validateOrderItem,
  validateOTPRequest,
  validateOTPVerification,
  validateOrderCreation,
  validateOrderConfirmation,
  validateFeedback,
  sanitizeBody,
};
