# Form Management Service

Backend API for the dynamic form builder — forms, submissions, auth, workspaces, uploads, and more.

## Quick Start

```bash
cd Form_Management_Service
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum
npm install
npm run dev
```

Service runs at **http://localhost:3004**  
Health check: `GET /health`

## Environment

See [`.env.example`](./.env.example) for all variables. Minimum required:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Long random string (32+ chars) |
| `MONGODB_URI` | MongoDB connection string |

## Architecture

```
Form_Management_Service/
├── app.js                 # Express app factory (used by tests)
├── server.js              # Bootstraps DB + starts server
├── config/                # appConfig, cors, rateLimit, database
├── controllers/           # Route handlers
├── middleware/            # auth, validate, errorHandler
├── models/                # Mongoose models
├── routes/                # API routes + Joi validation
├── services/              # email, tokens, storage
├── templates/email/       # HTML email templates
├── validators/            # Joi schemas
├── utils/                 # helpers (pagination, sanitize, audit, etc.)
└── tests/                 # Jest + Supertest
```

## Security Defaults

| Feature | Setting |
|---------|---------|
| Access token | 1 hour (`JWT_ACCESS_EXPIRES_IN`) — tighten to 15m once frontend uses refresh |
| Refresh token | 7 days, stored hashed in DB |
| Password rules | Min 8 chars, letter + number |
| Rate limiting | Auth + submission endpoints |
| CORS | Configurable via `CORS_ORIGINS` |
| Public forms | Enabled — published forms accept submissions |
| File uploads | Local disk, MIME allowlist |

## Email System

Templates are ready; sending uses **`EMAIL_PROVIDER=console`** by default (renders to console, does not send).

Templates:
- `templates/email/verifyEmail.html`
- `templates/email/resetPassword.html`
- `templates/email/welcome.html`

To connect a provider later, set `EMAIL_PROVIDER` to `resend`, `sendgrid`, or `smtp` and add the matching API keys in `.env`. The hook points are in `services/emailService.js`.

## Field options & dynamic mappings

Select fields can load options from **`/api/field-options`** (shared sets: countries, industries, etc.) and **`/api/dynamic-mappings`** (parent → child dropdowns). The legacy category API was removed.

Frontend dev UI: **Field Options (Dev)** tab (`FieldOptionsTester.jsx`).

## API Routes

### Auth `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Register user |
| POST | `/login` | Public | Login |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Bearer | Revoke refresh token |
| POST | `/forgot-password` | Public | Request reset email |
| POST | `/reset-password` | Public | Reset with token |
| POST | `/verify-email` | Public | Verify email |
| GET | `/me` | Bearer | Current user |
| PUT | `/profile` | Bearer | Update profile |
| PUT | `/change-password` | Bearer | Change password |
| POST | `/resend-verification` | Bearer | Resend verify email |

### Forms `/api/forms`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Optional | List forms (paginated) |
| GET | `/:id` | Optional | Get form |
| POST | `/` | Bearer | Create form |
| PUT | `/:id` | Bearer | Update form |
| DELETE | `/:id` | Bearer | Delete form (**hard delete** — permanent) |
| POST | `/:id/duplicate` | Bearer | Duplicate form |
| GET | `/:id/versions` | Bearer | Version history |
| POST | `/:id/versions/:n/restore` | Bearer | Restore version |

### Submissions `/api/submissions`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Optional | Submit form (public if published) |
| GET | `/` | Bearer | List submissions |
| GET | `/form/:formId` | Bearer | Submissions by form |
| GET | `/form/:formId/export` | Bearer | Export CSV |

### Other
- `/api/workspaces` — team management
- `/api/audit-logs` — activity log
- `/api/uploads/form/:formId` — file upload (public for published forms)
- `/api/field-options` — dynamic field options
- `/api/dynamic-mappings` — field dependency mappings

## Response Format

```json
{
  "success": true,
  "status": "success",
  "message": "Forms retrieved successfully",
  "data": { }
}
```

Validation errors:
```json
{
  "success": false,
  "status": "validation_error",
  "message": "Validation failed",
  "error": {
    "type": "validation_error",
    "message": "Validation failed",
    "errors": [{ "field": "email", "message": "..." }]
  }
}
```

## Pagination

List endpoints accept `?page=1&limit=20` and return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Tests

```bash
npm test
```

## Dev Scripts

```bash
node scripts/checkAllData.js   # Print MongoDB counts (forms, field options, mappings)
```

## Future (Planned)

| Feature | Description |
|---------|-------------|
| **S3 uploads** | `services/storageService.js` stub ready — move files off local disk |
| **Email providers** | Resend / SendGrid / SMTP — flip `EMAIL_PROVIDER` |
| **Soft delete** | `deletedAt` on forms/submissions; Trash + restore instead of permanent delete |
| **Webhooks** | POST to user URL when a submission is created (Zapier, Slack, CRM) |
| **Stripe billing** | Plans and usage limits |
| **API versioning** | Stable `/api/v1` for integrations |

See [PROJECT_ANALYSIS.md](../PROJECT_ANALYSIS.md) for frontend backlog (analytics dashboard, Field Options UI, Theme Editor).

## Frontend Integration Notes

Login/register responses include:

```json
{
  "token": "<accessToken>",
  "accessToken": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "expiresIn": "1h"
}
```

The frontend stores both tokens and auto-refreshes via `POST /api/auth/refresh` when the access token expires (see `Jay_2/services/authService.js` and `apiClient.js`).

Forms list now includes `pagination` — existing frontend code using `data.forms` continues to work.
