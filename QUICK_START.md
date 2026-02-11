# 🚀 Quick Start Guide - Food Ordering System

## 📖 Table of Contents

1. [First Time Setup](#first-time-setup)
2. [Daily Usage](#daily-usage)
3. [Common Commands](#common-commands)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

---

## 🎬 First Time Setup

### Step 1: Environment Configuration

1. Open `.env` file in the project root
2. **IMPORTANT:** Update these values for production:
   ```env
   JWT_SECRET=your-super-secret-random-string-change-this
   ALLOWED_ORIGINS=https://yourdomain.com
   ```
3. Verify other settings are correct:
   ```env
   NODE_ENV=production
   PORT=3000
   EMAIL_USER=sirajuddinkhan7718@gmail.com
   EMAIL_PASSWORD=rfhdaylhroyrkdmj
   ```

### Step 2: Initialize Database

```bash
npm run init-db
```

### Step 3: Create Initial Backup

```bash
npm run backup
```

### Step 4: Start Server

```bash
npm run start:clean
```

✅ **You're all set!** Visit http://localhost:3000

---

## 📅 Daily Usage

### Starting the Server

**RECOMMENDED WAY:**

```bash
npm run start:clean
```

✅ This automatically handles port conflicts!

**Alternative (if port is free):**

```bash
npm start
```

### Stopping the Server

Press `Ctrl+C` in the terminal where server is running

Or use PowerShell:

```powershell
Get-Process node | Stop-Process -Force
```

### Development Mode (Auto-restart on file changes)

```bash
npm run dev
```

---

## 🛠️ Common Commands

### Server Commands

```bash
npm start              # Start server normally
npm run start:clean    # Start with auto port cleanup (RECOMMENDED)
npm run dev            # Development mode (auto-reload)
```

### Database Commands

```bash
npm run init-db        # Reset database to initial state
npm run backup         # Create backup now
npm run backup:list    # Show all backups
```

### Health Checks

```bash
# Check if server is running
curl http://localhost:3000/api/health

# PowerShell version
Invoke-WebRequest http://localhost:3000/api/health
```

---

## 🔧 Troubleshooting

### Problem: "Port 3000 already in use"

**Solution:**

```bash
npm run start:clean
```

This automatically kills the old process and starts a fresh server.

**Manual Solution (if needed):**

```powershell
# Find processes using port 3000
netstat -ano | findstr :3000

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F

# Or kill all Node processes
Get-Process node | Stop-Process -Force
```

---

### Problem: "OTP not received in email"

**Check 1:** Is email going to spam?

- Check Gmail spam/junk folder
- Mark as "Not Spam" if found

**Check 2:** Is server in production mode?

```bash
# Should show: NODE_ENV=production
Invoke-WebRequest http://localhost:3000/api/health
```

**Check 3:** Check console logs

- Look for "OTP:" in terminal
- If showing in console but not email, check EMAIL_PASSWORD in .env

**Check 4:** Verify Gmail App Password

- Should be 16 characters: `rfhdaylhroyrkdmj`
- If changed, update in .env file

---

### Problem: "Failed to fetch" errors

**Solutions:**

1. **Check server is running:**

   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete`
   - Clear cached images and files

3. **Restart server:**

   ```bash
   npm run start:clean
   ```

4. **Check terminal for errors:**
   - Look for red error messages
   - Copy and search for solution

---

### Problem: "Database corrupted" or wrong data

**Solution: Restore from backup**

```bash
# List available backups
npm run backup:list

# Restore (replace filename with actual backup)
npm run backup:restore food_ordering_2026-02-11T08-37-20-934Z.json
```

**If no backups available:**

```bash
npm run init-db  # Reset to fresh state
```

---

## ✅ Best Practices

### 1. Daily Backups

Create a backup before making changes:

```bash
npm run backup
```

**Set up automatic daily backups (Windows Task Scheduler):**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Daily Database Backup"
4. Trigger: Daily at 2 AM
5. Action: Start a Program
   - Program: `cmd`
   - Arguments: `/c cd "C:\BILLING WEB APP" && npm run backup`

---

### 2. Monitor Server Health

Check health regularly:

```bash
curl http://localhost:3000/api/health
```

Look for:

- ✅ `"status": "OK"`
- ✅ `"database": "healthy"`
- ✅ `"emailService": "configured"`

---

### 3. Use start:clean

Always start with:

```bash
npm run start:clean
```

This prevents port conflict issues!

---

### 4. Check Logs Regularly

Look for these in terminal:

- ✅ Green messages = Good
- ⚠️ Yellow warnings = Check but usually okay
- ❌ Red errors = Need attention

---

### 5. Keep System Updated

```bash
# Check for outdated packages
npm outdated

# Update packages (carefully!)
npm update
```

---

## 🎯 Quick Testing Checklist

After starting server, test these:

### 1. Server Running

```bash
curl http://localhost:3000/api/health
```

Expected: `"status": "OK"`

### 2. Menu Loading

Open browser: http://localhost:3000/menu.html
Expected: See list of food items

### 3. OTP System

1. Go to http://localhost:3000
2. Enter email: `sirajuddinkhan7718@gmail.com`
3. Click "Send OTP"
4. Check Gmail for OTP
5. Enter OTP and verify

### 4. Place Order

1. Select items from menu
2. Add to cart
3. Proceed to payment
4. Confirm order
5. Check email for invoice

---

## 📊 Understanding Server Messages

### ✅ Good Messages (Green)

```
✅ Port 3000 is free!
✅ Environment variables validated successfully
Database connected successfully
🚀 Server is running on http://localhost:3000
✅ Food Ordering System is ready!
```

### ⚠️ Warnings (Yellow - Usually OK)

```
⚠️  Using default values for...
⚠️ Slow request: POST /send-otp took 3211.70ms
```

These are normal and expected.

### ❌ Errors (Red - Need Attention)

```
❌ ERROR: Port 3000 is already in use!
❌ Failed to connect to database
❌ Email service error
```

Follow troubleshooting guide above.

---

## 🔐 Security Reminders

### 1. Never Share .env File

Contains sensitive passwords!

### 2. Change Default Secrets

Update in `.env`:

```env
JWT_SECRET=your-unique-random-string-here
```

### 3. Use HTTPS in Production

Not HTTP! Configure reverse proxy (nginx) with SSL.

### 4. Regular Backups

Keep backups safe and offsite.

---

## 📞 Getting Help

### Check These First:

1. ✅ Read error message carefully
2. ✅ Check this guide's troubleshooting section
3. ✅ Look at server console logs
4. ✅ Try `npm run start:clean`
5. ✅ Restart computer (seriously, it helps!)

### Error Message Template:

When reporting errors, include:

```
1. What were you trying to do?
2. What command did you run?
3. What error message appeared?
4. Terminal output (copy and paste)
5. Health check output: curl http://localhost:3000/api/health
```

---

## 🎓 Learning Resources

### Understanding the Stack

- **Node.js:** Server runtime
- **Express:** Web framework
- **Email:** Gmail SMTP with Nodemailer
- **Database:** JSON file (will migrate to PostgreSQL)

### Key Files

- `server.js` - Main server code
- `.env` - Configuration (secrets)
- `database/food_ordering.json` - Database
- `public/` - Frontend files (HTML/CSS/JS)
- `routes/` - API endpoints

---

## 🎉 Success Indicators

Your system is working perfectly when:

- ✅ Server starts without errors
- ✅ Health check shows "OK"
- ✅ OTP emails arrive within 5 seconds
- ✅ Orders create successfully
- ✅ Invoices sent to email
- ✅ No errors in console logs

---

## 📱 Quick Reference Card

```
╔════════════════════════════════════════════╗
║     FOOD ORDERING SYSTEM - COMMANDS        ║
╠════════════════════════════════════════════╣
║ START SERVER                               ║
║   npm run start:clean                      ║
║                                            ║
║ STOP SERVER                                ║
║   Ctrl+C                                   ║
║                                            ║
║ CREATE BACKUP                              ║
║   npm run backup                           ║
║                                            ║
║ CHECK HEALTH                               ║
║   http://localhost:3000/api/health         ║
║                                            ║
║ RESET DATABASE                             ║
║   npm run init-db                          ║
║                                            ║
║ VIEW APP                                   ║
║   http://localhost:3000                    ║
╚════════════════════════════════════════════╝
```

---

**Remember:** When in doubt, use `npm run start:clean` - it solves 90% of issues!

**Pro Tip:** Bookmark this guide for quick reference!
