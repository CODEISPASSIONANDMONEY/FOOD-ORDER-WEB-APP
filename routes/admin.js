const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const db = require("../config/database");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "menu-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Get single menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const result = await db.handleSelect("menu_items", { id: itemId });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
    });
  }
});

// Add new menu item
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, is_available } = req.body;

    // Validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description, price, and category are required",
      });
    }

    const menuItem = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim(),
      is_available: is_available === "1" || is_available === 1 ? 1 : 0,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      created_at: new Date().toISOString(),
    };

    const result = await db.handleInsert("menu_items", menuItem);

    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: {
        id: result.insertId,
        ...menuItem,
      },
    });
  } catch (error) {
    console.error("Error adding menu item:", error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: "Failed to add menu item",
      error: error.message,
    });
  }
});

// Update menu item
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const { name, description, price, category, is_available } = req.body;

    // Check if item exists
    const existingItems = await db.handleSelect("menu_items", { id: itemId });
    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const existingItem = existingItems[0];

    // Prepare update data
    const updateData = {
      name: name ? name.trim() : existingItem.name,
      description: description ? description.trim() : existingItem.description,
      price: price ? parseFloat(price) : existingItem.price,
      category: category ? category.trim() : existingItem.category,
      is_available:
        is_available !== undefined
          ? is_available === "1" || is_available === 1
            ? 1
            : 0
          : existingItem.is_available,
    };

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (existingItem.image) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "public",
          existingItem.image,
        );
        await fs.unlink(oldImagePath).catch(console.error);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await db.handleUpdate("menu_items", { id: itemId }, updateData);

    res.json({
      success: true,
      message: "Menu item updated successfully",
      data: {
        id: itemId,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating menu item:", error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: "Failed to update menu item",
      error: error.message,
    });
  }
});

// Toggle menu item availability
router.patch("/:id/toggle", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    // Get current status
    const items = await db.handleSelect("menu_items", { id: itemId });
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const currentStatus = items[0].is_available;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await db.handleUpdate(
      "menu_items",
      { id: itemId },
      { is_available: newStatus },
    );

    res.json({
      success: true,
      message: `Menu item is now ${newStatus === 1 ? "available" : "unavailable"}`,
      data: {
        id: itemId,
        is_available: newStatus,
      },
    });
  } catch (error) {
    console.error("Error toggling menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle menu item availability",
    });
  }
});

// Delete menu item
router.delete("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);

    // Get item to delete image
    const items = await db.handleSelect("menu_items", { id: itemId });
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const item = items[0];

    // Delete image file if exists
    if (item.image) {
      const imagePath = path.join(__dirname, "..", "public", item.image);
      await fs.unlink(imagePath).catch(console.error);
    }

    // Delete from database
    await db.handleDelete("menu_items", { id: itemId });

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });
  }
});

// Get all categories
router.get("/categories/list", async (req, res) => {
  try {
    const items = await db.handleSelect("menu_items");
    const categories = [...new Set(items.map((item) => item.category))];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

module.exports = router;
