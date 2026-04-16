# Authentication System Setup

## ✅ What Was Created

### Frontend Components

1. **Auth Service** (`Jay_2/services/authService.js`)
   - Handles all authentication API calls
   - Manages token storage in localStorage
   - Methods: register, login, logout, getCurrentUser, updateProfile, changePassword, requestPasswordReset, resetPassword, verifyEmail, resendVerification

2. **Auth Context** (`Jay_2/contexts/AuthContext.jsx`)
   - React context for managing authentication state
   - Provides: user, loading, error, login, register, logout, updateUser, isAuthenticated

3. **Auth Components** (`Jay_2/components/auth/`)
   - `Login.jsx` - Login form
   - `Register.jsx` - Registration form
   - `ForgotPassword.jsx` - Password reset request
   - `ResetPassword.jsx` - Password reset with token
   - `ProtectedRoute.jsx` - Wrapper for protected pages

4. **Pages** (`Jay_2/app/`)
   - `/login` - Login page
   - `/register` - Registration page
   - `/forgot-password` - Forgot password page
   - `/reset-password` - Reset password page (requires token)
   - `/verify-email` - Email verification page (requires token)

### Backend Routes

**New Auth Routes** (`Form_Management_Service/routes/authRoutes.js`):
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)
- `POST /api/auth/resend-verification` - Resend verification email (protected)

**New Controller Methods** (`Form_Management_Service/controllers/authController.js`):
- `forgotPassword` - Generates reset token (logs in dev mode)
- `resetPassword` - Resets password with token
- `verifyEmail` - Verifies email with token
- `resendVerification` - Resends verification email (logs in dev mode)

---

## 🔧 How It Works

### Authentication Flow

1. **Registration:**
   - User registers → Backend creates user with verification token
   - Token is logged in console (dev mode) or sent via email (production)
   - User is automatically logged in after registration

2. **Login:**
   - User enters email/password
   - Backend validates and returns JWT token
   - Token stored in localStorage
   - User redirected to dashboard

3. **Password Reset:**
   - User requests reset → Backend generates token
   - Token logged in console (dev) or sent via email (production)
   - User clicks link → Enters new password
   - Password updated

4. **Email Verification:**
   - User receives verification link
   - Clicks link → Email verified
   - Status updated in database

---

## 📧 Email Service Setup (For Later)

Currently, email tokens are **logged to console in development mode**. To enable actual email sending:

### Option 1: Nodemailer (Recommended)

1. **Install Nodemailer:**
   ```bash
   cd Form_Management_Service
   npm install nodemailer
   ```

2. **Create Email Service** (`Form_Management_Service/services/emailService.js`):
   ```javascript
   const nodemailer = require('nodemailer');

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT || 587,
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   exports.sendPasswordResetEmail = async (email, token) => {
     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
     
     await transporter.sendMail({
       from: process.env.FROM_EMAIL,
       to: email,
       subject: 'Password Reset Request',
       html: `
         <h2>Password Reset</h2>
         <p>Click the link below to reset your password:</p>
         <a href="${resetLink}">${resetLink}</a>
         <p>This link expires in 1 hour.</p>
       `,
     });
   };

   exports.sendVerificationEmail = async (email, token) => {
     const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
     
     await transporter.sendMail({
       from: process.env.FROM_EMAIL,
       to: email,
       subject: 'Verify Your Email',
       html: `
         <h2>Email Verification</h2>
         <p>Click the link below to verify your email:</p>
         <a href="${verifyLink}">${verifyLink}</a>
       `,
     });
   };
   ```

3. **Update .env:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=noreply@yourapp.com
   FRONTEND_URL=http://localhost:3000
   ```

4. **Update Controllers:**
   - Replace `console.log` with `emailService.sendPasswordResetEmail()`
   - Replace `console.log` with `emailService.sendVerificationEmail()`

### Option 2: SendGrid

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Create Email Service** using SendGrid API

3. **Add to .env:**
   ```env
   SENDGRID_API_KEY=your-api-key
   FROM_EMAIL=noreply@yourapp.com
   ```

### Option 3: AWS SES

1. **Install AWS SDK:**
   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **Configure AWS credentials**

---

## 🚀 Usage

### Frontend

1. **Login:**
   - Navigate to `/login`
   - Enter email and password
   - User is redirected to dashboard

2. **Register:**
   - Navigate to `/register`
   - Fill in form
   - User is automatically logged in

3. **Password Reset:**
   - Click "Forgot password" on login page
   - Enter email
   - Check console (dev) or email (production) for reset link
   - Click link and enter new password

4. **Email Verification:**
   - After registration, check console (dev) or email (production) for verification link
   - Click link to verify email

### Backend

All routes are ready. In development, tokens are logged to console. In production, configure email service to send actual emails.

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Token expiration (7 days default)
- ✅ Password reset tokens expire in 1 hour
- ✅ Email verification tokens
- ✅ Protected routes require authentication
- ✅ Multi-tenancy (users only see their own data)

---

## 📝 Notes

- **Development Mode:** Tokens are logged to console for easy testing
- **Production Mode:** Configure email service to send actual emails
- **Token Storage:** JWT tokens stored in localStorage (consider httpOnly cookies for production)
- **Email Verification:** Optional but recommended for production

---

## 🐛 Troubleshooting

### "Token expired"
- Password reset tokens expire in 1 hour
- Request a new reset link

### "User not found" on password reset
- Backend doesn't reveal if email exists (security)
- Check console logs in dev mode for token

### Email not received
- Check spam folder
- Verify email service is configured
- Check server logs for errors
- In dev mode, check console for token

---

## ✅ Next Steps

1. **Test the authentication flow:**
   - Register a new user
   - Login
   - Test password reset (check console for token)
   - Test email verification (check console for token)

2. **Configure email service when ready:**
   - Choose email provider (Nodemailer, SendGrid, AWS SES)
   - Add credentials to `.env`
   - Update controllers to use email service

3. **Production considerations:**
   - Use httpOnly cookies instead of localStorage
   - Add rate limiting
   - Add CAPTCHA for registration/login
   - Enable HTTPS
   - Set up proper email templates
