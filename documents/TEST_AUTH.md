# Testing Authentication

## Quick Test with cURL

### 1. Start the Server
```bash
cd Form_Management_Service
npm start
# or
npm run dev
```

Server runs on: `http://localhost:3004`

---

## Test Steps

### Step 1: Register a New User

**Windows PowerShell:**
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3004/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

**Windows CMD / Git Bash:**
```bash
curl -X POST http://localhost:3004/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
```

**Linux/Mac:**
```bash
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "user",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token!** You'll need it for protected routes.

---

### Step 2: Login (Alternative)

```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

### Step 3: Get Current User (Protected Route)

Replace `YOUR_TOKEN` with the token from Step 1:

```bash
curl -X GET http://localhost:3004/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Step 4: Create a Form (Protected Route)

```bash
curl -X POST http://localhost:3004/api/forms \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Form",
    "schema": {
      "sections": [
        {
          "title": "Section 1",
          "fields": [
            {
              "type": "text",
              "label": "Name",
              "name": "name",
              "required": true
            }
          ]
        }
      ]
    }
  }'
```

---

### Step 5: Get User's Forms (Protected Route)

```bash
curl -X GET http://localhost:3004/api/forms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Step 6: Test Without Token (Should Fail)

```bash
curl -X POST http://localhost:3004/api/forms \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Form","schema":{}}'
```

**Expected:** `401 Unauthorized`

---

## Test Script (Node.js)

I've created a test script you can run: `test-auth.js`

```bash
node test-auth.js
```

---

## Postman Collection

You can also import these endpoints into Postman:

1. **Register**
   - Method: POST
   - URL: `http://localhost:3004/api/auth/register`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "name": "Test User"
     }
     ```

2. **Login**
   - Method: POST
   - URL: `http://localhost:3004/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```

3. **Get Forms** (Protected)
   - Method: GET
   - URL: `http://localhost:3004/api/forms`
   - Headers:
     - `Authorization: Bearer YOUR_TOKEN`

---

## Environment Variables

Make sure you have a `.env` file with:

```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/form_builder
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## Troubleshooting

### "No token provided"
- Make sure you're including `Authorization: Bearer TOKEN` header
- Check that token is not expired

### "User not found" / "Invalid email or password"
- Check email/password are correct
- Make sure user exists (register first)

### "Form not found"
- Make sure you're using the correct form ID
- Check that the form belongs to the authenticated user

### Connection refused
- Make sure server is running on port 3004
- Check MongoDB is running
