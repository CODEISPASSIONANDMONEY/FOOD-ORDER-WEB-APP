// Performance monitoring middleware
function performanceMonitor(req, res, next) {
  const start = process.hrtime.bigint();

  // Capture response finish
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(
        `⚠️ Slow request: ${req.method} ${req.url} took ${duration.toFixed(2)}ms`,
      );
    }

    // Log all requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `📊 ${req.method} ${req.url} - ${res.statusCode} - ${duration.toFixed(2)}ms`,
      );
    }
  });

  next();
}

// Memory usage monitor
function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log("\n💾 Memory Usage:");
  for (let key in used) {
    console.log(
      `  ${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`,
    );
  }
  console.log("");
}

// Health check endpoint with detailed metrics
function healthCheck(req, res) {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
    },
    nodeVersion: process.version,
    platform: process.platform,
  });
}

// Request metrics collector
class MetricsCollector {
  constructor() {
    this.requests = {
      total: 0,
      success: 0,
      errors: 0,
      byEndpoint: {},
    };
    this.startTime = Date.now();
  }

  recordRequest(endpoint, statusCode) {
    this.requests.total++;

    if (statusCode >= 200 && statusCode < 300) {
      this.requests.success++;
    } else if (statusCode >= 400) {
      this.requests.errors++;
    }

    if (!this.requests.byEndpoint[endpoint]) {
      this.requests.byEndpoint[endpoint] = {
        count: 0,
        errors: 0,
      };
    }

    this.requests.byEndpoint[endpoint].count++;
    if (statusCode >= 400) {
      this.requests.byEndpoint[endpoint].errors++;
    }
  }

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      uptime: `${uptime} seconds`,
      requests: this.requests,
      requestsPerSecond: (this.requests.total / uptime).toFixed(2),
      errorRate:
        ((this.requests.errors / this.requests.total) * 100).toFixed(2) + "%",
    };
  }

  middleware() {
    return (req, res, next) => {
      const originalSend = res.send;
      res.send = function (data) {
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        this.recordRequest(endpoint, res.statusCode);
        return originalSend.call(this, data);
      }.bind(this);

      next();
    };
  }
}

// Database performance monitor
class DBPerformanceMonitor {
  constructor() {
    this.queries = [];
    this.slowQueryThreshold = 100; // ms
  }

  logQuery(sql, duration) {
    const query = {
      sql: sql.substring(0, 100), // Truncate long queries
      duration,
      timestamp: new Date().toISOString(),
    };

    if (duration > this.slowQueryThreshold) {
      console.warn(`🐌 Slow query (${duration.toFixed(2)}ms): ${query.sql}`);
    }

    // Keep last 100 queries
    this.queries.push(query);
    if (this.queries.length > 100) {
      this.queries.shift();
    }
  }

  getSlowQueries() {
    return this.queries.filter((q) => q.duration > this.slowQueryThreshold);
  }

  getAverageQueryTime() {
    if (this.queries.length === 0) return 0;
    const total = this.queries.reduce((sum, q) => sum + q.duration, 0);
    return (total / this.queries.length).toFixed(2);
  }
}

// Export utilities
module.exports = {
  performanceMonitor,
  logMemoryUsage,
  healthCheck,
  MetricsCollector,
  DBPerformanceMonitor,
};
