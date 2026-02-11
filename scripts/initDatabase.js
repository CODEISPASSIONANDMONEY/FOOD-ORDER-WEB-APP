const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Ensure database directory exists
const dbDir = path.join(__dirname, "../database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "food_ordering.json");

function initializeDatabase() {
  console.log("Initializing JSON database...");

  try {
    const database = {
      users: [],
      menu_items: [
        {
          id: 1,
          name: "Margherita Pizza",
          description: "Classic pizza with tomato sauce, mozzarella, and basil",
          price: 12.99,
          category: "Pizza",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: "Pepperoni Pizza",
          description: "Pizza with pepperoni and cheese",
          price: 14.99,
          category: "Pizza",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 3,
          name: "Caesar Salad",
          description: "Fresh romaine lettuce with Caesar dressing",
          price: 8.99,
          category: "Salads",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 4,
          name: "Cheeseburger",
          description: "Beef burger with cheese, lettuce, and tomato",
          price: 11.99,
          category: "Burgers",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 5,
          name: "French Fries",
          description: "Crispy golden fries",
          price: 4.99,
          category: "Sides",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 6,
          name: "Chicken Wings",
          description: "8 pieces of spicy chicken wings",
          price: 10.99,
          category: "Appetizers",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 7,
          name: "Spaghetti Carbonara",
          description: "Pasta with bacon, egg, and parmesan",
          price: 13.99,
          category: "Pasta",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 8,
          name: "Grilled Salmon",
          description: "Fresh salmon with vegetables",
          price: 18.99,
          category: "Main Course",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 9,
          name: "Chocolate Cake",
          description: "Rich chocolate cake with frosting",
          price: 6.99,
          category: "Desserts",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
        {
          id: 10,
          name: "Soft Drink",
          description: "Coke, Pepsi, or Sprite",
          price: 2.99,
          category: "Beverages",
          is_available: 1,
          created_at: new Date().toISOString(),
        },
      ],
      orders: [],
      order_items: [],
      feedback: [],
      _counters: {
        users: 1,
        menu_items: 11,
        orders: 1,
        order_items: 1,
        feedback: 1,
      },
    };

    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2), "utf8");

    console.log("✅ Database initialized successfully!");
    console.log("✅ Sample menu items inserted!");
    console.log("\nYou can now start the server with: npm start\n");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }
}

initializeDatabase();
