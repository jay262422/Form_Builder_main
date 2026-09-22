# Single Source of Truth – Forms

## Summary

Forms are **API-first**. The frontend uses **`fileFormManager.js`**, which talks to **`Form_Management_Service`** (MongoDB). localStorage is a **fallback only** when the API is unavailable.

## Data Flow

```
Jay_2 UI  →  fileFormManager.js  →  Express API (:3004)  →  MongoDB
                    ↓
            localStorage (fallback if API down)
```

## Frontend

- **`services/fileFormManager.js`** — all form CRUD goes through here
- Unwraps backend shape `{ success, data, message }` into plain objects/arrays
- **`services/authService.js`** — JWT auth (access + refresh tokens from backend)
- Auth required on home page; forms scoped by user/workspace on backend

## Backend

- Form mutations require authentication + workspace role
- Public read of **published** forms; public **submission** to published forms
- Standardized responses via `utils/responseHelper.js`

## API Response Shape

**Success:**
```json
{ "success": true, "status": "success", "message": "...", "data": { } }
```

**Error:**
```json
{ "success": false, "status": "validation_error", "message": "...", "error": { "type": "...", "message": "..." } }
```

## Run Locally

```bash
# Terminal 1
cd Form_Management_Service && npm run dev

# Terminal 2
cd Jay_2 && npm run dev
```

See [Form_Management_Service/README.md](../Form_Management_Service/README.md) for env vars.
