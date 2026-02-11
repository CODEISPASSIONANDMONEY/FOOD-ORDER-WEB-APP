# 🍽️ Food Ordering Web Application

A complete QR-based food ordering system with email OTP authentication, real-time order tracking, invoice generation, and customer feedback system.

## ✨ Features

- **QR Code Entry**: Customers scan a QR code to access the ordering system
- **Email OTP Authentication**: Secure login with one-time passwords sent via email
- **Interactive Menu**: Browse menu items by category with real-time price calculations
- **Order Management**: Add/remove items with quantity controls and instant total updates
- **Invoice Generation**: Professional PDF invoices sent via email
- **Payment QR System**: Display QR codes for payment processing
- **Feedback System**: Post-payment feedback forms sent to customer emails
- **Responsive Design**: Works seamlessly on mobile devices and desktops

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL/MariaDB
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Email Service**: Nodemailer
- **PDF Generation**: PDFKit
- **QR Code**: QRCode.js

## 📋 Prerequisites

Before running this application, ensure you have:

- Node.js (v14 or higher)
- MySQL or MariaDB server
- A Gmail account (for sending emails) with App Password enabled

## 🚀 Installation & Setup

### 1. Clone or Download the Project

```bash
cd "c:\BILLING WEB APP"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
copy .env.example .env
```

Edit the `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=food_ordering_db
DB_PORT=3306

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Application Settings
OTP_EXPIRY_MINUTES=5
SHOP_NAME=My Restaurant
SHOP_EMAIL=shop@restaurant.com
SHOP_PHONE=+1234567890
SHOP_ADDRESS=123 Main Street, City, State 12345
```

### 4. Gmail App Password Setup

To send emails, you need a Gmail App Password:

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password and use it as `EMAIL_PASSWORD` in `.env`

### 5. Initialize the Database

```bash
npm run init-db
```

This will:

- Create the database
- Set up all required tables
- Insert sample menu items

### 6. Start the Server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 📱 Usage Flow

### For Customers:

1. **Scan QR Code** → Opens the website
2. **Enter Email** → Receive OTP via email
3. **Verify OTP** → Access the menu
4. **Select Items** → Add items to order with quantities
5. **Confirm Order** → Generates Order ID
6. **Receive Invoice** → PDF invoice sent to email
7. **Pay via QR** → Scan payment QR code at counter
8. **Confirm Payment** → Feedback form sent to email
9. **Submit Feedback** → Rate experience and provide suggestions

## 📂 Project Structure

```
BILLING WEB APP/
├── config/
│   └── database.js          # Database connection configuration
├── database/
│   └── schema.sql            # Database schema and sample data
├── routes/
│   ├── auth.js               # OTP authentication routes
│   ├── menu.js               # Menu management routes
│   ├── orders.js             # Order processing routes
│   └── feedback.js           # Feedback collection routes
├── services/
│   ├── emailService.js       # Email sending functionality
│   └── invoiceService.js     # PDF invoice generation
├── scripts/
│   └── initDatabase.js       # Database initialization script
├── public/
│   ├── css/
│   │   └── style.css         # Application styles
│   ├── index.html            # Landing page (Email entry)
│   ├── verify-otp.html       # OTP verification page
│   ├── menu.html             # Menu selection page
│   ├── confirm-order.html    # Order confirmation page
│   ├── payment.html          # Payment QR page
│   ├── thank-you.html        # Success page
│   └── feedback.html         # Feedback form page
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies
├── server.js                 # Main server file
└── README.md                 # This file
```

## 🗄️ Database Schema

### Tables:

- **users**: Stores customer emails and OTP data
- **menu_items**: Restaurant menu with prices and categories
- **orders**: Order details and status
- **order_items**: Individual items in each order
- **feedback**: Customer ratings and suggestions

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and authenticate

### Menu

- `GET /api/menu` - Get all available menu items
- `GET /api/menu/:id` - Get specific menu item

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:orderId` - Get order details
- `POST /api/orders/:orderId/confirm` - Confirm order and send invoice
- `POST /api/orders/:orderId/paid` - Mark order as paid

### Feedback

- `POST /api/feedback` - Submit customer feedback
- `GET /api/feedback/:orderId` - Get feedback for order

## 🎨 Customization

### Adding Menu Items

You can add menu items directly in the database:

```sql
INSERT INTO menu_items (name, description, price, category)
VALUES ('New Dish', 'Delicious description', 15.99, 'Main Course');
```

Or update the `database/schema.sql` file before initialization.

### Changing Email Templates

Edit the email templates in [services/emailService.js](services/emailService.js):

- `sendOTPEmail()` - OTP email template
- `sendInvoiceEmail()` - Invoice email template
- `sendFeedbackEmail()` - Feedback form email template

### Modifying Invoice Format

Customize the invoice PDF layout in [services/invoiceService.js](services/invoiceService.js).

## 🔒 Security Notes

- **Never commit your `.env` file** - It contains sensitive credentials
- OTPs expire after 5 minutes (configurable)
- Use strong database passwords
- Enable 2-factor authentication on your Gmail account
- Consider adding rate limiting for production use

## 🐛 Troubleshooting

### Email Not Sending

- Verify Gmail App Password is correct
- Check that 2-Step Verification is enabled on Gmail
- Ensure EMAIL_USER and EMAIL_PASSWORD are set in `.env`

### Database Connection Failed

- Verify MySQL service is running
- Check database credentials in `.env`
- Ensure the database exists (run `npm run init-db`)

### Port Already in Use

- Change PORT in `.env` to a different number
- Or stop the process using port 3000

## 📝 Development

To modify the application:

1. **Backend Changes**: Edit files in `routes/` and `services/`
2. **Frontend Changes**: Edit HTML files in `public/`
3. **Styling**: Modify [public/css/style.css](public/css/style.css)
4. **Database**: Update [database/schema.sql](database/schema.sql) and re-run init

## 🚀 Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production` in `.env`
2. Use a production-grade database (MySQL 8.0+)
3. Add SSL/TLS for secure connections
4. Implement rate limiting and request validation
5. Set up proper logging and monitoring
6. Use a process manager like PM2
7. Configure a reverse proxy (nginx/Apache)

## 📄 License

ISC

## 🤝 Support

For issues or questions, please check the code comments or create an issue in the repository.

## 🎉 Features to Add (Future Enhancements)

- Admin dashboard for order management
- Real-time order status updates (WebSocket)
- Multiple payment gateway integrations
- Customer order history
- Loyalty points system
- Multi-language support
- Print receipt functionality
- Analytics and reporting dashboard

---

**Built with ❤️ for efficient restaurant operations**
