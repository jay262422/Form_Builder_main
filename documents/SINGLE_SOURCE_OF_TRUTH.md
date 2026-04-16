# Single Source of Truth – Forms

## Summary

Forms are now **API-first**. The frontend uses **fileFormManager** only, which talks to the **Form_Management_Service** (MongoDB). localStorage is used only as a **fallback** when the API is unavailable.

## What Was Done

### Frontend (Jay_2)

- **fileFormManager.js**
  - All responses from the backend use the standardized shape `{ success, data, message }`. The service now unwraps `data` (e.g. `data.forms`, `data` for a single form) so the rest of the app sees plain arrays/objects.
  - Applied to: `getAllForms`, `getFormByCustomId`, `saveForm`, `updateForm`, `duplicateForm`.
- **TemplatePreview.jsx**
  - Replaced non-existent `getForm()` with `getFormByCustomId()` and fixed import path to `../services/fileFormManager`.
- **FormManager**, **FormManagerDemo**, **VisualFormBuilder** already used fileFormManager only; no change needed.

### Backend (Form_Management_Service)

- **formRoutes.js**
  - Form mutations (create, update, delete, duplicate, stats, export) use **optionalAuth** instead of **authenticate**, so the app works without login (e.g. dev or single-tenant).
- **formController.js**
  - `createForm`: sets `formData.userId = req.userId` only when `req.userId` is present (no 401 when unauthenticated).
- **models/Form.js**
  - `userId` is **optional** (`required: false`, `default: null`) so forms can be created without a user. When you add full auth/SaaS, you can require `userId` again and switch routes back to `authenticate`.

## How to Run

1. **Start MongoDB** (local or Atlas).
2. **Start Form_Management_Service**
   - `cd Form_Management_Service && npm run dev` (or `node server.js`).
   - Default port: **3004**.
3. **Start frontend**
   - `cd Jay_2 && npm run dev`.
   - Set `NEXT_PUBLIC_API_URL=http://localhost:3004` if needed (default is already 3004 in simpleApiConfig).
4. **Use the app**
   - Form Manager loads and saves forms via the API. If the API is down, fileFormManager falls back to localStorage and shows a toast.

## API Response Shape

Backend uses **utils/responseHelper.js**:

- Success: `{ success: true, status: 'success', message, data }`
- Error: `{ success: false, status: '<type>', message, error: { type, message } }`

Frontend always treats the **first-level** payload as the response body and uses `data` when present (e.g. `responseData.data.forms` or `responseData.data` for one form).

## Next Steps (SaaS)

- Re-enforce auth: use `authenticate` on form mutation routes and require login in the UI.
- Ensure every form has `userId` (and optionally `workspaceId`) for multi-tenancy.
- Add billing/usage and optionally rate limits.
