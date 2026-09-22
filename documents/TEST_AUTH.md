# Testing Authentication

## Automated (recommended)

```bash
cd Form_Management_Service
npm test
```

Covers health check, validation errors, and 404 responses.

## Manual API tests

### Register
```bash
curl -X POST http://localhost:3004/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Get current user
```bash
curl http://localhost:3004/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh token
```bash
curl -X POST http://localhost:3004/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Frontend

1. Start backend + frontend
2. Go to `http://localhost:3000/register`
3. Create account → redirects to Form Manager
4. Logout / login via `/login`

## Notes

- Password must be 8+ chars with at least one letter and one number
- Access token default expiry: 1 hour
- Refresh token: 7 days
- Email templates render to console when `EMAIL_PROVIDER=console`

See [JWT_SECRET_GUIDE.md](./JWT_SECRET_GUIDE.md) for env setup.
