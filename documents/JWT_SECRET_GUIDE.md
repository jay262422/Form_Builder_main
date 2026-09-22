# JWT Secret Key Guide

## What is a JWT Secret?

A JWT secret is used to sign and verify authentication tokens. Keep it long, random, and out of git.

## Generate One

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or with OpenSSL:

```bash
openssl rand -hex 64
```

## Setup

1. Copy `Form_Management_Service/.env.example` to `.env`
2. Set `JWT_SECRET=` to your generated value (32+ characters)
3. Never commit `.env`

## Related Env Vars

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | required | Signs access tokens |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

## Test

```bash
cd Form_Management_Service
npm test
```

See [TEST_AUTH.md](./TEST_AUTH.md) for manual curl examples.

## Security Notes

- Use different secrets for development and production
- Changing the secret invalidates all existing tokens
- Do not use simple passwords like `mysecret123`
