# Gmail OTP Configuration Guide

## 📧 Overview
The system now supports sending OTP codes via email to **Gmail addresses only** (@gmail.com). Other email providers will continue to receive OTPs in the terminal.

## 🔧 Setup Instructions

### Step 1: Generate Gmail App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/security
   - Sign in with your Gmail account

2. **Enable 2-Step Verification** (if not already enabled)
   - Go to "2-Step Verification"
   - Follow the setup wizard

3. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter: "CardioSense"
   - Click "Generate"
   - **COPY THE 16-CHARACTER PASSWORD** (shown once only)

### Step 2: Update .env File

Open `backend/.env` and update these values:

```env
# Gmail SMTP Configuration (for Gmail OTP delivery)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-actual-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM_EMAIL=your-actual-email@gmail.com
SMTP_FROM_NAME=CardioSense
```

**Example:**
```env
SMTP_USERNAME=johndoe@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=johndoe@gmail.com
```

### Step 3: Restart Backend Server

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ How It Works

### Gmail Users (@gmail.com)
- ✅ OTP sent via email
- ✅ Beautiful HTML formatted email
- ✅ 15-minute expiration notice
- ✅ Fallback to terminal if email fails

### Other Email Providers
- ✅ OTP printed to terminal (as before)
- ✅ No change in behavior

## 📬 Email Features

The OTP email includes:
- Professional CardioSense branding
- Large, easy-to-read OTP code
- Purpose of the OTP (Signup, Password Reset, etc.)
- 15-minute expiration timer
- Security warning message
- Responsive design for mobile devices

## 🧪 Testing

### Test with Gmail:
1. Use a Gmail address during signup
2. Check your Gmail inbox
3. OTP should arrive within seconds

### Test with Other Emails:
1. Use a non-Gmail address (e.g., @yahoo.com, @outlook.com)
2. Check the backend terminal
3. OTP will be printed there

## ⚠️ Common Issues

### "SMTP Authentication Failed"
- **Problem**: Wrong app password
- **Solution**: Generate a new app password and update .env

### "OTP will be printed to terminal"
- **Problem**: SMTP not configured or not a Gmail address
- **Solution**: 
  - Ensure SMTP_USERNAME and SMTP_PASSWORD are set in .env
  - Check if email ends with @gmail.com

### Email Not Received
- Check spam folder
- Verify Gmail account settings allow app passwords
- Check terminal for error messages
- Ensure 2-Step Verification is enabled

## 🔒 Security Notes

1. **Never commit .env file** - It's in .gitignore
2. **Use app-specific passwords** - Not your regular Gmail password
3. **Rotate passwords regularly** - Generate new app passwords periodically
4. **Revoke unused passwords** - Remove old app passwords from Google Account settings

## 📝 Files Modified

- `backend/.env` - Added SMTP configuration
- `backend/app/services/email_service.py` - Created (new file)
- `backend/app/services/otp_service.py` - Updated to send emails
- `backend/GMAIL_OTP_SETUP.md` - This guide (new file)

## 🎯 Use Cases

✅ Signup verification (Gmail users)
✅ Password reset (Gmail users)
✅ Two-factor authentication (Gmail users)

---

**Need Help?** Check the terminal output for detailed error messages and configuration hints.
