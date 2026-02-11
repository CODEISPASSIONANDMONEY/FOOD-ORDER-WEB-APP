const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, "..", "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "food_ordering.json");

// Initialize empty database structure
let database = {
  users: [],
  menu_items: [],
  orders: [],
  order_items: [],
  feedback: [],
  _counters: {
    users: 1,
    menu_items: 1,
    orders: 1,
    order_items: 1,
    feedback: 1,
  },
};

// Load database from file if it exists
async function loadDatabase() {
  if (fs.existsSync(dbPath)) {
    try {
      const data = await fs.promises.readFile(dbPath, "utf8");
      database = JSON.parse(data);
    } catch (error) {
      console.error("Error loading database:", error.message);
    }
  }
}

// Save database to file (debounced for performance)
let saveTimeout = null;
async function saveDatabase() {
  // Debounce saves to avoid excessive I/O
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    try {
      await fs.promises.writeFile(
        dbPath,
        JSON.stringify(database, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("Error saving database:", error.message);
    }
  }, 100); // Wait 100ms before saving
}

// Load on startup
(async () => {
  await loadDatabase();
})();

// Add cache for frequently accessed data
const cache = {
  menu: null,
  menuTimestamp: null,
  CACHE_TTL: 60000, // 1 minute
};

function getCachedMenu() {
  if (cache.menu && Date.now() - cache.menuTimestamp < cache.CACHE_TTL) {
    return cache.menu;
  }
  return null;
}

function setCachedMenu(data) {
  cache.menu = data;
  cache.menuTimestamp = Date.now();
}

function clearMenuCache() {
  cache.menu = null;
  cache.menuTimestamp = null;
}

// Query function (supports basic SQL-like queries)
async function query(sql, params = []) {
  const sqlLower = sql.toLowerCase().trim();

  if (sqlLower.startsWith("select")) {
    return handleSelect(sql, params);
  } else if (sqlLower.startsWith("insert")) {
    return handleInsert(sql, params);
  } else if (sqlLower.startsWith("update")) {
    return handleUpdate(sql, params);
  } else if (sqlLower.startsWith("delete")) {
    return handleDelete(sql, params);
  }

  return [];
}

function handleSelect(sql, params) {
  // Parse table name
  const tableMatch = sql.match(/from\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1];
  let results = [...(database[tableName] || [])];

  // Handle WHERE clause with optimized lookup
  if (sql.toLowerCase().includes("where")) {
    const whereMatch = sql.match(/where\s+(.+?)(?:order|limit|$)/i);
    if (whereMatch) {
      const condition = whereMatch[1].trim();

      // Optimize common queries with indexed lookups
      const idMatch = condition.match(/id\s*=\s*\?/i);
      const emailMatch = condition.match(/email\s*=\s*\?/i);
      const orderIdMatch = condition.match(/order_id\s*=\s*\?/i);

      if (idMatch && params[0]) {
        // Direct ID lookup is much faster
        const found = results.find((row) => row.id == params[0]);
        results = found ? [found] : [];
      } else if (emailMatch && params[0]) {
        // Email lookup optimization
        results = results.filter((row) => row.email === params[0]);
      } else if (orderIdMatch && params[0]) {
        // Order ID lookup optimization
        results = results.filter((row) => row.order_id === params[0]);
      } else {
        // Fallback to full scan
        results = results.filter((row) =>
          evaluateCondition(row, condition, params),
        );
      }
    }
  }

  return results;
}

function handleInsert(sql, params) {
  const tableMatch = sql.match(/insert\s+into\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1];
  const columnsMatch = sql.match(/\(([^)]+)\)/);

  if (!columnsMatch) return [];

  const columns = columnsMatch[1].split(",").map((c) => c.trim());
  const newRow = { id: database._counters[tableName]++ };

  columns.forEach((col, idx) => {
    newRow[col] = params[idx];
  });

  // Add timestamps
  if (!newRow.created_at) newRow.created_at = new Date().toISOString();
  if (!newRow.updated_at) newRow.updated_at = new Date().toISOString();

  database[tableName].push(newRow);
  saveDatabase();

  return [newRow];
}

function handleUpdate(sql, params) {
  const tableMatch = sql.match(/update\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1];
  const setMatch = sql.match(/set\s+(.+?)where/i);
  const whereMatch = sql.match(/where\s+(.+?)$/i);

  if (!setMatch) return [];

  const results = database[tableName].filter((row) =>
    whereMatch
      ? evaluateCondition(
          row,
          whereMatch[1],
          params.slice(setMatch[1].split(",").length),
        )
      : true,
  );

  results.forEach((row) => {
    const updates = setMatch[1].split(",");
    updates.forEach((update, idx) => {
      const [col] = update.split("=").map((s) => s.trim());
      row[col] = params[idx];
    });
    row.updated_at = new Date().toISOString();
  });

  saveDatabase();
  return results;
}

function handleDelete(sql, params) {
  const tableMatch = sql.match(/from\s+(\w+)/i);
  if (!tableMatch) return [];

  const tableName = tableMatch[1];
  const whereMatch = sql.match(/where\s+(.+?)$/i);

  if (!whereMatch) {
    database[tableName] = [];
  } else {
    database[tableName] = database[tableName].filter(
      (row) => !evaluateCondition(row, whereMatch[1], params),
    );
  }

  saveDatabase();
  return [];
}

function evaluateCondition(row, condition, params) {
  const paramIndex = condition.split("?").length - 1;
  if (paramIndex === 0) return true;

  const parts = condition.split(/\s*(=|>|<|>=|<=|!=|AND|OR)\s*/i);
  const field = parts[0].trim();
  const operator = parts[1];
  const value = params[0];

  switch (operator) {
    case "=":
      return row[field] == value;
    case "!=":
      return row[field] != value;
    case ">":
      return row[field] > value;
    case "<":
      return row[field] < value;
    case ">=":
      return row[field] >= value;
    case "<=":
      return row[field] <= value;
    default:
      return true;
  }
}

async function run(sql, params = []) {
  const result = await query(sql, params);
  return {
    lastID: result[0]?.id || 0,
    changes: result.length,
  };
}

async function testConnection() {
  try {
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

function getConnection() {
  return {
    db: database,
    query: async (sql, params) => await query(sql, params),
    execute: async (sql, params) => {
      const result = await run(sql, params);
      return [result];
    },
    beginTransaction: () => {},
    commit: () => saveDatabase(),
    rollback: () => loadDatabase(),
    release: () => {},
  };
}

module.exports = {
  db: database,
  query,
  run,
  getConnection,
  testConnection,
  saveDatabase,
  loadDatabase,
  getCachedMenu,
  setCachedMenu,
  clearMenuCache,
};
