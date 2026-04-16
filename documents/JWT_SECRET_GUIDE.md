# JWT Secret Key Guide

## What is a JWT Secret?

A JWT (JSON Web Token) secret is a cryptographic key used to:
- **Sign** tokens when users log in (proves the token came from your server)
- **Verify** tokens when users make requests (ensures the token is valid and hasn't been tampered with)

Think of it like a password that only your server knows - it's used to create and verify authentication tokens.

---

## ✅ I've Generated One For You

I've created a `.env` file with a randomly generated JWT secret. **You're all set!**

The secret is: `1f761167d946a37bea9e9646e825d88a31d2c2fb677be6de3f9fe421438b95f3bcabcbd20c9615bc0e16ceaa4455546e2bd5e1ecb2c178f88ff795508cbc7331`

---

## 🔐 How to Generate Your Own (Optional)

If you want to generate a new one, here are several methods:

### Method 1: Using Node.js (Recommended)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 2: Using OpenSSL
```bash
openssl rand -hex 64
```

### Method 3: Using PowerShell (Windows)
```powershell
-join ((48..57) + (65..70) + (97..102) | Get-Random -Count 128 | ForEach-Object {[char]$_})
```

### Method 4: Online Generator
Visit: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")

---

## ⚠️ Important Security Notes

1. **Keep it Secret**: Never commit your `.env` file to Git
2. **Use Different Secrets**: 
   - Development: Use one secret
   - Production: Use a different, stronger secret
3. **Length**: Should be at least 32 characters (64+ is better)
4. **Randomness**: Use cryptographically secure random generators

---

## 📝 Your Current Setup

Your `.env` file is located at:
```
Form_Management_Service/.env
```

**Make sure this file is in `.gitignore`!** (It should already be there)

---

## 🚀 Next Steps

1. ✅ JWT secret is set in `.env`
2. ✅ Make sure MongoDB is running
3. ✅ Start your server: `npm start` or `npm run dev`
4. ✅ Test authentication: `node test-auth.js`

---

## 🔄 Changing the Secret

If you need to change the JWT secret:

1. Generate a new one (use Method 1 above)
2. Update `.env` file: `JWT_SECRET=your_new_secret_here`
3. **Important**: All existing tokens will become invalid - users will need to log in again

---

## ❓ FAQ

**Q: Can I use a simple password like "mysecret123"?**  
A: No! Use a long, random string. Simple passwords can be guessed.

**Q: What happens if someone gets my JWT secret?**  
A: They could create fake tokens and impersonate users. Keep it secret!

**Q: Do I need different secrets for development and production?**  
A: Yes! Use different secrets for each environment.

**Q: How long should the secret be?**  
A: At least 64 characters (128 hex characters = 64 bytes) is recommended.
