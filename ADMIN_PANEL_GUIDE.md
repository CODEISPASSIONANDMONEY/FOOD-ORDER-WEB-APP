# 🎨 Admin Panel Documentation

## Overview

The Admin Panel is a comprehensive interface for restaurant owners to manage their menu items with full CRUD (Create, Read, Update, Delete) capabilities.

## 🚀 Quick Start

### Access the Admin Panel

```
http://localhost:3000/admin.html
```

### Features at a Glance

- ✅ Add new menu items
- ✅ Upload item images (up to 5MB)
- ✅ Edit existing items
- ✅ Toggle item availability
- ✅ Delete items
- ✅ Real-time preview
- ✅ Drag & drop image upload

---

## 📋 User Guide

### Adding a New Menu Item

1. **Fill in the form on the left:**
   - **Item Name\*** (required): e.g., "Margherita Pizza"
   - **Description\*** (required): Describe the item
   - **Price\*** (required): Enter price in dollars (e.g., 12.99)
   - **Category\*** (required): Select from dropdown
   - **Item Image** (optional): Upload or drag & drop
   - **Available for ordering**: Check if ready to sell

2. **Upload an Image:**
   - Click the upload area OR drag & drop an image
   - Supported formats: JPEG, PNG, GIF, WebP
   - Recommended size: 800x600 pixels
   - Maximum file size: 5MB
   - Image preview appears after selection

3. **Click "Add Menu Item"**
   - Success message appears
   - Item shows in the right panel
   - Form resets for next item

### Editing an Existing Item

1. **Click the "✏️ Edit" button** on any menu item card
2. Form fills with current item data
3. Modify any fields you want to change
4. Upload a new image (optional - keeps old one if not changed)
5. Click "💾 Update Menu Item"
6. Click "Cancel Edit" to reset form

### Toggle Item Availability

- Click "🔽 Hide" to make item unavailable for orders
- Click "🔼 Show" to make item available again
- Status badge updates: ✅ Available / ❌ Unavailable
- Customers won't see unavailable items in menu

### Deleting an Item

1. Click "🗑️ Delete" on the item card
2. Confirm deletion in popup dialog
3. Item removed from database
4. Associated image file deleted from server

---

## 🎯 Best Practices

### Image Guidelines

- **Resolution**: 800x600px or higher
- **Aspect Ratio**: 4:3 recommended (landscape)
- **File Size**: Under 2MB for faster loading
- **Format**: JPEG preferred (smaller file size)
- **Content**: Show the dish clearly, well-lit, appetizing

### Naming Conventions

- Use clear, descriptive names
- Capitalize first letter of each word
- Include key ingredients if relevant
- Example: "Grilled Chicken Caesar Salad"

### Descriptions

- Keep it concise (1-2 sentences)
- Mention key ingredients
- Highlight special preparation methods
- Mention allergens if relevant
- Example: "Fresh romaine lettuce with grilled chicken, parmesan cheese, and homemade Caesar dressing. Contains dairy and gluten."

### Pricing

- Always use two decimal places ($12.99)
- Price competitively for your market
- Update prices regularly
- Consider combo deals

### Categories

Choose from predefined categories:

- Pizza
- Burgers
- Salads
- Sides
- Desserts
- Beverages
- Pasta
- Sandwiches

---

## 🔧 Technical Details

### API Endpoints

#### Get All Menu Items

```http
GET /api/menu
Response: { success: true, data: { items: [...] } }
```

#### Get Single Menu Item

```http
GET /api/admin/menu/:id
Response: { success: true, data: {...} }
```

#### Add New Menu Item

```http
POST /api/admin/menu
Content-Type: multipart/form-data
Body: { name, description, price, category, is_available, image }
Response: { success: true, message: "...", data: {...} }
```

#### Update Menu Item

```http
PUT /api/admin/menu/:id
Content-Type: multipart/form-data
Body: { name, description, price, category, is_available, image }
Response: { success: true, message: "...", data: {...} }
```

#### Toggle Availability

```http
PATCH /api/admin/menu/:id/toggle
Response: { success: true, message: "...", data: {...} }
```

#### Delete Menu Item

```http
DELETE /api/admin/menu/:id
Response: { success: true, message: "..." }
```

### Database Schema

Menu items are stored with these fields:

```javascript
{
  id: Number,              // Auto-increment
  name: String,            // Item name
  description: String,     // Item description
  price: Number,           // Price in dollars
  category: String,        // Category name
  is_available: Number,    // 1 = available, 0 = unavailable
  image: String,           // Path to image file (/uploads/menu-xxx.jpg)
  created_at: String       // ISO timestamp
}
```

### File Storage

- **Location**: `/public/uploads/`
- **Format**: `menu-{timestamp}-{random}.{ext}`
- **Example**: `menu-1707652800000-123456789.jpg`
- **Cleanup**: Old images deleted when item deleted or image replaced

### Image Upload Configuration

```javascript
{
  maxFileSize: 5MB,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  destination: 'public/uploads/',
  filename: 'menu-{timestamp}-{random}.{ext}'
}
```

---

## 🐛 Troubleshooting

### Image Upload Fails

**Problem**: "File too large" error
**Solution**: Resize image to under 5MB before uploading

**Problem**: "Invalid file type" error
**Solution**: Use only JPEG, PNG, GIF, or WebP formats

**Problem**: Image not showing after upload
**Solution**: Check browser console for errors, ensure uploads folder exists

### Form Submission Issues

**Problem**: "Validation failed" error
**Solution**: Ensure all required fields (\*) are filled

**Problem**: Price not accepting value
**Solution**: Use numbers only, decimal point allowed (e.g., 12.99)

**Problem**: Changes not saving
**Solution**: Check browser console, ensure server is running

### Display Issues

**Problem**: Menu items not loading
**Solution**:

```bash
# Check server logs
# Verify database connection
# Test health endpoint: http://localhost:3000/api/health
```

**Problem**: Images not displaying
**Solution**:

- Check if `/uploads/` folder exists
- Verify image paths in database
- Check file permissions

---

## 🔒 Security Considerations

### Current Implementation

- Basic functionality without authentication
- Suitable for local/internal use
- All endpoints publicly accessible

### Recommended for Production

1. **Add Authentication:**

```javascript
// Add admin login system
// Use JWT tokens
// Protect all /api/admin/* routes
```

2. **Add Authorization:**

```javascript
// Role-based access control
// Admin vs. Staff permissions
// Audit logs for changes
```

3. **Enhanced Validation:**

```javascript
// Server-side image validation
// File type verification
// Malware scanning
// Input sanitization
```

4. **Rate Limiting:**

```javascript
// Limit upload frequency
// Prevent abuse
// Already configured: 100 req/15min
```

---

## 📊 Future Enhancements

### Planned Features

- [ ] Batch upload (multiple items at once)
- [ ] Image editing (crop, resize, filters)
- [ ] Duplicate item function
- [ ] Import/Export menu (CSV, JSON)
- [ ] Analytics dashboard
- [ ] Ingredient management
- [ ] Nutritional information fields
- [ ] Multi-language descriptions
- [ ] Seasonal items scheduling
- [ ] Combo deals creator

### Integration Ideas

- [ ] Third-party image CDN (Cloudinary)
- [ ] Inventory management system
- [ ] POS system integration
- [ ] Social media sharing
- [ ] QR code generator per item

---

## 🎨 Customization

### Changing Categories

Edit in `admin.html`:

```html
<select id="itemCategory" required>
  <option value="Your Category">Your Category</option>
  <!-- Add more categories -->
</select>
```

### Changing Upload Limits

Edit in `routes/admin.js`:

```javascript
limits: {
  fileSize: 10 * 1024 * 1024, // Change to 10MB
}
```

### Styling the Admin Panel

Modify inline styles in `admin.html` or extract to:

```css
/* public/css/admin.css */
```

---

## 📝 Quick Reference Card

```
╔══════════════════════════════════════════╗
║     ADMIN PANEL - QUICK REFERENCE        ║
╠══════════════════════════════════════════╣
║ ACCESS                                   ║
║   http://localhost:3000/admin.html       ║
║                                          ║
║ ADD ITEM                                 ║
║   Fill form → Upload image → Add         ║
║                                          ║
║ EDIT ITEM                                ║
║   Click Edit → Modify → Update           ║
║                                          ║
║ HIDE/SHOW ITEM                           ║
║   Click toggle button                    ║
║                                          ║
║ DELETE ITEM                              ║
║   Click Delete → Confirm                 ║
║                                          ║
║ IMAGE SPECS                              ║
║   Format: JPEG, PNG, GIF, WebP           ║
║   Size: Up to 5MB                        ║
║   Recommended: 800x600px                 ║
║                                          ║
║ CATEGORIES                               ║
║   Pizza, Burgers, Salads, Sides,         ║
║   Desserts, Beverages, Pasta,            ║
║   Sandwiches                             ║
╚══════════════════════════════════════════╝
```

---

## 💡 Tips & Tricks

### Keyboard Shortcuts

- **Tab**: Navigate between form fields
- **Enter**: Submit form (when focused)
- **Esc**: Clear image preview

### Drag & Drop

- Drag image files directly from file explorer
- Drop anywhere in the upload area
- Instant preview appears

### Bulk Operations

- To update multiple items quickly, use Edit mode
- Keep browser window open during uploads
- Save changes frequently

### Image Optimization

Before uploading, optimize images using:

- **Online**: TinyPNG, Squoosh
- **Desktop**: Photoshop, GIMP, IrfanView
- **Bulk**: ImageMagick, XnConvert

---

## 📞 Support

### Getting Help

1. Check this documentation first
2. Review [QUICK_START.md](QUICK_START.md) for general issues
3. Check server logs in terminal
4. Test API endpoints with health check

### Common Support Questions

**Q: Can I access admin panel from mobile?**
A: Yes! The panel is fully responsive. However, desktop is recommended for easier image management.

**Q: What happens to old images when I upload new ones?**
A: Old images are automatically deleted from the server when replaced or when the item is deleted.

**Q: Can I revert changes?**
A: Not currently. Always create a database backup before major changes using `npm run backup`.

**Q: How do I backup menu items?**
A: Use `npm run backup` command. See [QUICK_START.md](QUICK_START.md) for details.

---

**Created**: February 11, 2026  
**Version**: 1.0.0  
**Admin Panel**: Fully Operational ✅
