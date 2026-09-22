# Backend Depth Plan — Make It Fully Good First

> **Status:** Phase 1–5 implemented (June 2026). See `Form_Management_Service/README.md` for setup and `PROJECT_ANALYSIS.md` for full product snapshot.

## Decisions Locked In

| Topic | Decision |
|-------|----------|
| Email | Templates + service ready; `EMAIL_PROVIDER=console` until you connect Resend/SendGrid/SMTP |
| Categories | **Removed** — legacy e-marketplace hierarchy; use `/api/field-options` + `/api/dynamic-mappings` |
| Public forms | Kept — published forms accept public submissions |
| JWT | Access token + refresh 7d (hashed in DB); `POST /api/auth/refresh`; frontend auto-refresh wired |
| File storage | Local disk now; `storageService.js` stub for future S3 |
| Delete | **Hard delete** today — soft delete (`deletedAt`) is Phase 6 |

---

## What Was Built

### Phase 1 — Foundation ✅
- `.env.example`
- `config/appConfig.js`, `cors.js`, `rateLimit.js`
- Auth middleware uses `responseHelper`
- Global error handler (Mongoose, Joi, CORS errors)
- Input sanitization middleware

### Phase 2 — Validation ✅
- Joi validators for auth, forms, submissions
- `middleware/validate.js` on routes

### Phase 3 — Email ✅
- `services/emailService.js` with provider abstraction
- HTML templates: verify, reset, welcome
- Console provider (renders, does not send)

### Phase 4 — Email templates ✅
- HTML templates: verify, reset, welcome
- Console provider (renders, does not send)

### Phase 5 — Security & Data ✅
- Refresh token rotation + logout
- Form/submission pagination
- Server-side submission validation against form schema
- Upload MIME allowlist
- Basic Jest tests

---

## Still To Do Later

- Connect real email provider (flip `EMAIL_PROVIDER`)
- More integration tests (forms CRUD, workspaces, submissions export)
- Phase 6 items below (webhooks, soft delete, billing, S3, API versioning)

### Frontend (not backend-only)

- Form Builder polish — primary focus in `Jay_2`
- Field Options + Theme Editor — dev tabs today; full UI later
- Platform light/dark shell theme — separate from per-form theme editor

---

## Original Plan (Reference — historical)

The sections below were written before Phase 1–5 were completed. Use the **Current Backend Scorecard** above for live status.

The frontend (`Jay_2`) already depends on a stable API. Fixing backend gaps now means:

- Frontend work won't break when auth/validation changes
- One source of truth for forms, submissions, workspaces
- Easier to test without UI noise
- Safer to refactor the builder later

**Verdict:** Yes — backend depth first is the right order.

---

## Current Backend Scorecard (June 2026)

| Area | Status | Notes |
|------|--------|-------|
| Auth (JWT, register, login) | ✅ Done | Profile, password change, refresh rotation |
| Workspaces + roles | ✅ Done | Invite, accept, member management |
| Forms CRUD | ✅ Done | Scoped by workspace/user; **hard delete** |
| Form versioning | ✅ Done | Snapshot + restore |
| Submissions | ✅ Done | Create, list, export, stats |
| File uploads | ✅ Done | Multer, MIME allowlist |
| Audit logging | ✅ Done | Model + helper + read API |
| Standardized responses | ✅ Done | Controllers use `responseHelper` |
| Field options (Mongo) | ✅ Done | Full CRUD — shared option sets for forms |
| Dynamic mappings (Mongo) | ✅ Done | Full CRUD |
| Category API | ✅ Removed | Replaced by field-options + dynamic-mappings |
| Request validation (Joi) | ✅ Done | `middleware/validate.js` on routes |
| Rate limiting | ✅ Done | Auth + submission endpoints |
| CORS | ✅ Done | Configurable via `CORS_ORIGINS` |
| Input sanitization | ✅ Done | Strip HTML middleware |
| Email service | ✅ Templates | Console provider; connect Resend/SMTP later |
| Pagination | ✅ Done | Forms list + field-options lists |
| Automated tests | ⚠️ Basic | Jest + Supertest; 3 tests passing |
| `.env.example` | ✅ Done | |
| API documentation | ✅ Done | `Form_Management_Service/README.md` |
| Soft delete | ❌ Not started | Phase 6 |
| Webhooks | ❌ Not started | Phase 6 — POST on submission create |
| Billing / Stripe | ❌ Not started | Phase 6 |

---

## Definition of Done — “Backend Fully Good”

The backend is **done** when all of this is true:

1. Every write endpoint validates input with Joi before hitting controllers
2. All responses (including auth middleware errors) use `responseHelper`
3. Rate limiting on auth + public submission endpoints
4. CORS locked to configured frontend origin(s)
5. Email verify + password reset actually send mail (or clear dev mock)
6. Category data moved to MongoDB (or explicitly deprecated)
7. Forms list paginated; consistent pagination pattern everywhere
8. Integration tests for auth, forms, submissions, workspaces
9. `.env.example` + setup README for `Form_Management_Service`
10. No known security holes in upload/submission public routes

---

## Phased Work Plan

### Phase 1 — Foundation (Week 1)
**Goal:** Consistency + safety baseline. No new features.

| # | Task | Why |
|---|------|-----|
| 1.1 | Create `.env.example` | Document `JWT_SECRET`, `MONGODB_URI`, `PORT`, `CORS_ORIGIN`, email vars |
| 1.2 | Joi validation layer | `middleware/validate.js` + schemas per route group |
| 1.3 | Fix auth middleware | Use `unauthorizedResponse` / `forbiddenResponse` from `responseHelper` |
| 1.4 | Global error handler polish | Mongoose errors, JWT errors, Joi errors → consistent shape |
| 1.5 | CORS config | `CORS_ORIGIN` env var, default `http://localhost:3000` |
| 1.6 | Rate limiting | `express-rate-limit` on `/api/auth/*` and `POST /api/submissions` |

**Deliverable:** API behaves consistently; basic abuse protection.

---

### Phase 2 — Data Integrity (Week 1–2)
**Goal:** Clean data layer, no file-system outliers.

| # | Task | Why |
|---|------|-----|
| 2.1 | Pagination for `GET /api/forms` | `page`, `limit`, `total`, `totalPages` in response |
| 2.2 | Pagination for field-options + dynamic-mappings lists | Same pattern |
| 2.3 | Migrate category data to MongoDB | New `Category` model OR fold into field-options |
| 2.4 | Input sanitization | Strip HTML / trim strings on validated body |
| 2.5 | Enforce workspace scoping audit | Review every controller for data leaks |
| 2.6 | Submission validation against form schema | Validate required fields server-side on create |

**Deliverable:** Data is scoped, validated, and paginated.

---

### Phase 3 — Auth & Email (Week 2)
**Goal:** Real auth flows, not console stubs.

| # | Task | Why |
|---|------|-----|
| 3.1 | Email service abstraction | `services/emailService.js` — Resend or Nodemailer |
| 3.2 | Wire verify + reset emails | Replace TODOs in `authController.js` |
| 3.3 | Optional: require email verified for mutations | Config flag `REQUIRE_EMAIL_VERIFIED` |
| 3.4 | Refresh token or longer session strategy | Document JWT expiry policy |
| 3.5 | Password strength rules in Joi | Min length, complexity |

**Deliverable:** Users can actually verify email and reset password.

---

### Phase 4 — Hardening Public Routes (Week 2–3)
**Goal:** Public form submit + upload are safe.

| # | Task | Why |
|---|------|-----|
| 4.1 | Public submission rate limit | Per IP + per formId |
| 4.2 | Upload MIME type allowlist | Reject executables |
| 4.3 | Upload virus scan hook (optional) | Placeholder for ClamAV etc. |
| 4.4 | Require published form for public submit | Already partial — verify fully |
| 4.5 | Honeypot / spam score field (optional) | Reduce bot submissions |

**Deliverable:** Public endpoints can't be easily abused.

---

### Phase 5 — Tests & Docs (Week 3)
**Goal:** Confidence to change code without breaking frontend.

| # | Task | Why |
|---|------|-----|
| 5.1 | Test setup with in-memory Mongo or test DB | `jest` + `supertest` |
| 5.2 | Auth flow tests | register, login, me, wrong password |
| 5.3 | Form CRUD tests | create, scoped list, update, delete |
| 5.4 | Submission tests | public create, owner list, export |
| 5.5 | Workspace tests | invite, accept, role check |
| 5.6 | `Form_Management_Service/README.md` | Setup, env, all routes table |
| 5.7 | Optional: OpenAPI spec | Auto-generate or hand-write |

**Deliverable:** `npm test` passes; new dev can run backend from README alone.

---

### Phase 6 — Nice to Have (Later)
Only after Phases 1–5 and frontend builder is stable:

| Item | Description |
|------|-------------|
| **Soft delete** | Add `deletedAt` on Form and Submission; list APIs exclude deleted rows; optional Trash / restore UI. Today: `DELETE` permanently removes records. |
| **Webhooks** | Per-form or workspace URL + secret; `POST` JSON payload when a submission is created (Zapier, Slack, CRM, Sheets). |
| **Analytics (backend)** | Aggregated stats endpoints if the frontend dashboard outgrows client-side charts in Submission Manager. |
| **API versioning** | `/api/v1/...` for stable public integrations. |
| **Stripe billing** | Plans, usage limits, subscription hooks. |
| **Redis caching** | Hot field-options reads. |
| **S3 storage** | Replace local disk uploads via `storageService.js` adapter. |

---

## Suggested Folder Structure (Refactor as We Go)

```
Form_Management_Service/
├── config/
│   ├── database.js
│   ├── cors.js
│   └── rateLimit.js
├── middleware/
│   ├── auth.js
│   ├── validate.js          ← NEW
│   └── sanitize.js          ← NEW
├── validators/              ← NEW
│   ├── authSchemas.js
│   ├── formSchemas.js
│   └── submissionSchemas.js
├── services/                ← NEW
│   └── emailService.js
├── controllers/             (keep, slim down)
├── models/
├── routes/
├── utils/
└── tests/                   ← NEW
    ├── auth.test.js
    ├── forms.test.js
    └── submissions.test.js
```

No big-bang rewrite — add folders incrementally per phase.

---

## What NOT to Do Yet

- Don't add billing/Stripe before core builder + tests are solid
- Don't switch to TypeScript on backend mid-sprint (stay JS, move fast)
- Don't implement webhooks/soft delete before submission + auth tests cover regressions

---

## Recommended Start Order (If Starting Today)

```
Day 1:  .env.example + CORS + rate limit + auth middleware response fix
Day 2:  Joi validate middleware + auth + form create/update schemas
Day 3:  Form pagination + submission schema validation
Day 4:  Category → Mongo decision + migration
Day 5:  Email service + wire auth TODOs
Week 2: Tests + README
```

---

## Open Decisions (Discuss Before Coding)

1. **Email provider** — Resend, SendGrid, or Nodemailer + Gmail SMTP for dev?
2. **Field Options scope** — Workspace-wide vs user-owned vs global templates?
3. **Public forms** — Keep `optionalAuth` on form reads, or require login for everything?
4. **Soft delete retention** — How long before permanent purge from Trash?
5. **File storage** — Stay local disk for now, or plan S3 in Phase 6?

---

## Success Metrics

- [x] `npm test` — passes (basic suite)
- [x] Invalid POST body returns `{ success: false, status: 'validation_error', error: { errors: [...] } }`
- [x] Rate limiting on auth endpoints
- [x] CORS configurable via `CORS_ORIGINS`
- [ ] Password reset email arrives in inbox (console provider today)
- [x] Forms list paginated; frontend loads all pages
- [x] Frontend refresh token flow wired

---

## Related Files

- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) — full project snapshot & product direction
- [Form_Management_Service/README.md](./Form_Management_Service/README.md) — API routes & env
- [documents/SINGLE_SOURCE_OF_TRUTH.md](./documents/SINGLE_SOURCE_OF_TRUTH.md) — API response shape
