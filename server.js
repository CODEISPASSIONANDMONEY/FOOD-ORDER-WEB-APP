const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Validate environment variables before starting
const { validateEnv } = require("./config/validateEnv");
validateEnv();

const db = require("./config/database");
const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");

// Optional: Performance monitoring
let performanceUtils;
if (process.env.ENABLE_PERFORMANCE_MONITORING === "true") {
  performanceUtils = require("./utils/performance");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development; configure properly in production
  }),
);

// Compression middleware for responses
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Optional: Performance monitoring middleware
if (performanceUtils) {
  app.use(performanceUtils.performanceMonitor);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use("/api/", limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 requests per 15 minutes
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

app.use("/api/auth/", authLimiter);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]
      : "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 600, // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Body parser with size limits
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin/menu", adminRoutes);

// Enhanced health check endpoint
app.get("/api/health", async (req, res) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
    },
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    checks: {},
  };

  // Database check
  try {
    const dbConnected = await db.testConnection();
    healthData.checks.database = dbConnected ? "healthy" : "unhealthy";
  } catch (error) {
    healthData.checks.database = "unhealthy";
    healthData.status = "DEGRADED";
  }

  // Email service check
  healthData.checks.emailService = process.env.EMAIL_USER
    ? "configured"
    : "not configured";

  // Performance metrics if available
  if (performanceUtils) {
    const metricsCollector = req.app.get("metricsCollector");
    if (metricsCollector) {
      const metrics = metricsCollector.getMetrics();
      healthData.performance = {
        totalRequests: metrics.totalRequests,
        averageResponseTime: metrics.averageResponseTime?.toFixed(2) + "ms",
        slowestEndpoint: metrics.slowestEndpoint,
      };
    }
  }

  res.json(healthData);
});

// Performance metrics endpoint (dev only)
if (process.env.NODE_ENV === "development" && performanceUtils) {
  app.get("/api/metrics", (req, res) => {
    const metricsCollector = req.app.get("metricsCollector");
    if (metricsCollector) {
      res.json(metricsCollector.getMetrics());
    } else {
      res.json({ message: "Metrics not available" });
    }
  });

  // Memory usage endpoint
  app.get("/api/memory", (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(memory.external / 1024 / 1024)} MB`,
    });
  });
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  // Log error details for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Check if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Send appropriate response
  if (req.accepts("html")) {
    res.status(500).sendFile(path.join(__dirname, "public", "500.html"));
  } else {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// 404 handler
app.use((req, res) => {
  // Serve custom 404 page for HTML requests
  if (req.accepts("html")) {
    res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
  } else {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const connected = await db.testConnection();
    if (!connected) {
      console.error(
        "Failed to connect to database. Please check your configuration.",
      );
      process.exit(1);
    }

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📧 Email service configured with ${process.env.EMAIL_USER}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME}`);
      console.log(`\n✅ Food Ordering System is ready!\n`);
    });

    // Handle port already in use error
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error(`\n💡 SOLUTION: Another server is already running.`);
        console.error(`   Please use the existing server terminal OR`);
        console.error(`   Close it first, then try again.\n`);
        console.error(
          `   To automatically fix this, run: npm run start:clean\n`,
        );
        process.exit(1);
      } else {
        console.error("Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
