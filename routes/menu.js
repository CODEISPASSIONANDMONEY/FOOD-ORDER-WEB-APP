const express = require("express");
const router = express.Router();
const db = require("../config/database");

// Simple in-memory cache
let menuCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute

// Get all available menu items
router.get("/", async (req, res) => {
  try {
    // Check cache first
    if (
      menuCache &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < CACHE_TTL
    ) {
      return res.json(menuCache);
    }

    const menuItems = await db.query(
      `SELECT id, name, description, price, category, image_url 
             FROM menu_items 
             WHERE is_available = TRUE 
             ORDER BY category, name`,
    );

    // Group by category
    const groupedMenu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    const response = {
      success: true,
      data: {
        items: menuItems,
        grouped: groupedMenu,
      },
    };

    // Update cache
    menuCache = response;
    cacheTimestamp = Date.now();

    res.json(response);
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
    });
  }
});

// Get menu item by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const items = await db.query(
      "SELECT * FROM menu_items WHERE id = ? AND is_available = TRUE",
      [id],
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: items[0],
    });
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
    });
  }
});

module.exports = router;
