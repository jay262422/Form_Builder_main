# Form Builder — Project Analysis

> Snapshot of the codebase as of June 2026. Use this as the starting point for planning improvements.

---

## What This Project Is

A **dynamic form builder platform** with two main parts:

| Layer | Stack | Role |
|--------|--------|------|
| **Jay_2** | Next.js 14, React 18, Tailwind | UI — build forms, preview, submit, manage submissions |
| **Form_Management_Service** | Express, MongoDB, JWT | API — forms, auth, workspaces, submissions, uploads, audit logs |

**Typical user flow:** Login → Form Manager → Form Builder → Preview → Publish → collect submissions.

```
Next.js UI  →  fileFormManager  →  Express API (:3004)  →  MongoDB
                      ↓
              localStorage fallback (when API is down)
```

---

## Product Direction (Locked for Now)

### Three post-build areas (keep all — complete later)

| Module | Purpose | Status |
|--------|---------|--------|
| **Form Builder** | Structure, sections, fields, validation, conditional logic | **Active focus** — primary editor |
| **Theme Editor** | Per-form layout, colors, typography, look & feel (not platform shell theme) | Dev tab + Form Manager entry; polish later |
| **Field Options** | Shared reusable option sets (countries, industries, etc.) importable across forms and workspaces | Dev tab (`FieldOptionsTester`); API live at `/api/field-options` |

**Field Options** matter because select fields can pull from shared libraries — one user or workspace creates a set once and reuses it on many forms; others in the workspace can use the same sets.

**Theme Editor** runs after the form exists — it adjusts how the form looks, separate from a future **platform light/dark** toggle on the app shell.

### Builders (temporary dual path)

| Builder | Component | Role |
|---------|-----------|------|
| **Form Builder** | `VisualFormBuilder.jsx` | **Primary** — default Create/Edit path from Form Manager |
| **Builder Lab** | `VisualFormBuilderNext.jsx` | **Temporary** — styling reference until platform themes merge; hide when ready |

Long-term: one builder. Short-term: keep both; Form Builder is the path to finalize.

### Preview (both kept)

1. **Form Manager → Preview** — full-page preview of a **saved** form (`FormBuilder` / `FormWizard`).
2. **Form Builder → Build \| Preview toggle** — in-editor live preview of **current** schema (may be unsaved).

### Home tabs

- **Form Manager** — everyone
- **Field Options (Dev)** — admin / workspace owner
- **Theme Editor (Dev)** — admin / workspace owner

Builder Layout exploration routes were removed; static mocks live in `Jay_2/design-reference/`.

---

## Architecture (Current State)

### Frontend (`Jay_2`)

- **App shell:** Auth-protected home with tabs (Manager, Field Options dev, Theme Editor dev).
- **Core loop:** `FormManagerDemo` orchestrates manager → builder → preview → submissions.
- **Rendering:** `FormBuilder` + `FieldRegistry` (24+ field types).
- **Primary builder:** `VisualFormBuilder` — three-column layout, Build \| Preview in canvas, Structure panel with drag reorder.
- **Builder Lab:** `VisualFormBuilderNext` (~890 lines) — alternate UI via “Builder Lab” in Form Manager.
- **Data layer:** `fileFormManager.js` talks to the API; falls back to localStorage if API is unavailable.

### Backend (`Form_Management_Service`)

| Route prefix | Purpose |
|--------------|---------|
| `/api/auth` | Register, login, profile, password reset, refresh tokens |
| `/api/forms` | CRUD, duplicate, stats, export, versioning |
| `/api/submissions` | Create, list, export |
| `/api/workspaces` | Teams, invites, roles |
| `/api/audit-logs` | Activity history |
| `/api/uploads` | File uploads |
| `/api/field-options` | Shared dynamic field option sets |
| `/api/dynamic-mappings` | Parent → child dropdown mappings |

Recent work: Joi validation, rate limits, email templates, refresh tokens, pagination, legacy category API removed. See [BACKEND_DEPTH_PLAN.md](./BACKEND_DEPTH_PLAN.md).

**Delete behavior today:** hard delete (`findOneAndDelete`) — no soft delete yet.

---

## What Is Good (Keep These)

### 1. Strong form engine

- **24+ field types** — text, select, file, signature, repeater, calculated, currency, etc.
- **Conditional logic** — show/hide fields and sections
- **Validation** — `FormValidator` with custom rules
- **Multi-section and step-by-step** forms via `FormWizard`
- **Themes** and layout options

### 2. Backend has grown beyond basic CRUD

- JWT auth + protected routes + refresh flow (frontend wired)
- **Workspaces** with roles (`owner`, `admin`, `editor`, `viewer`)
- **Form versioning** (snapshot + restore)
- **Audit logging**
- **File uploads**
- Standardized API responses (`responseHelper.js`) on main controllers

### 3. Clear product modules

- Form Builder layout stabilized (top bar, canvas workspace, Structure / Properties)
- Field Options + Theme Editor kept as dev tools until productized
- Settings page: profile, password, workspace, invites, audit logs

### 4. Practical resilience

- API-first with localStorage fallback during dev or API outages
- Error boundaries, toasts, unsaved-changes guards in the builder

### 5. SaaS foundations exist

- Users, workspaces, roles
- Form ownership (`userId`, `workspaceId`)
- Submissions + export + basic per-form analytics charts
- Audit trail

---

## What Is Weak (Fix Over Time)

### 1. Code organization

| File | Problem |
|------|---------|
| `VisualFormBuilder.jsx` | Large — still improving layout; primary builder |
| `FormManager.jsx` | 1,400+ lines — manager + settings + versions in one file |
| Two builders | Form Builder + Builder Lab until themes merge |

### 2. Documentation

- Root README and this file kept current
- Obsolete docs removed from `documents/` (June 2026 cleanup)
- [documents/README.md](./documents/README.md) indexes what remains

### 3. Security gaps (reduced, not all done)

- Joi, rate limits, CORS, sanitization — **done**
- Email flows — templates ready; `EMAIL_PROVIDER=console` until you connect a provider
- Connect real email provider when ready

### 4. Remaining code debt

- Split `FormManager.jsx` when touching it
- Frontend has no automated tests; backend has basic Jest tests (3 tests)
- **`jsconfig.json`** added for JS project tooling (`@/*` paths)

### 5. Still open

- Finalize Form Builder (left library, right Properties polish)
- Productize Field Options + Theme Editor UI
- Platform light/dark on app shell (separate from per-form theme)
- Merge Builder Lab into Form Builder; remove Lab entry points

---

## Feature Maturity Map

| Area | Status | Notes |
|------|--------|-------|
| Form building | **Strong** | Form Builder is primary; Lab temporary |
| Form rendering / submit | **Strong** | Wizard, validation, conditional logic |
| Form CRUD + API | **Strong** | MongoDB-backed, paginated list |
| Auth (login/register) | **Done** | UI + backend wired |
| Refresh tokens | **Done** | `authService` + `apiClient.authenticatedFetch` |
| Email verify / reset | **Templates ready** | Console provider; connect Resend/SMTP later |
| Workspaces / teams | **Mostly done** | Settings UI + backend |
| Submissions | **Done** | Manager + export |
| Submission analytics (basic) | **Partial** | Charts in Submission Manager (~500 sample); not a full dashboard |
| Form versioning | **Backend done** | UI partially in FormManager settings |
| Audit logs | **Done** | Settings tab |
| File uploads | **Done** | Backend + field type |
| Field options | **Partial** | API + dev tester; builder picker UI later |
| Theme editor | **Partial** | Dev tab + per-form theme; polish after builder |
| Soft delete | **Not started** | Hard delete only today |
| Webhooks / integrations | **Not started** | Planned for submission events |
| Billing / SaaS limits | **Not started** | Documented as future |
| Code export / npm package | **Not started** | Documented as future |

---

## Unfinished Work — Backlog

### Do soon

1. **Finalize Form Builder** — left field library, right Properties/Structure polish
2. **Split giant files** — especially `FormManager.jsx`
3. **Platform light/dark** — app shell (after builder stable)
4. **Field Options UI** — create/edit/import, workspace scope, pick in builder
5. **Theme Editor flow** — build form → theme → save to form `ui_part`

### Done recently

- Backend validation, rate limits, CORS, sanitization, email templates
- Register/reset password rules aligned with backend (8+ chars, letter + number)
- Form list loads all API pages (pagination fix in `fileFormManager`)
- Legacy category API removed (use field-options + dynamic-mappings)
- Form Builder layout: top bar, Build \| Preview canvas, Structure tab, field reorder
- Builder Layout routes removed; mocks in `Jay_2/design-reference/`
- Dead code + obsolete docs removed; root README
- Frontend refresh token flow wired

### Later (SaaS / production — explained)

| # | Item | What it means | Today |
|---|------|---------------|-------|
| 16 | **Billing (Stripe)** | Plans, usage limits, paid tiers | Not started |
| 17 | **Analytics dashboard** | Workspace-level insights: trends, completion rates, comparisons — beyond the small charts in Submission Manager | Basic charts only in submissions view |
| 18 | **Webhooks / integrations** | On new submission, POST JSON to user-configured URLs (Zapier, Slack, CRM, Sheets) | Not started |
| 19 | **Soft delete** | Mark forms/submissions deleted (`deletedAt`), hide from lists, allow restore | Hard delete only |
| 20 | **API versioning** | `/api/v1/...` for stable public API | Single `/api` tree |
| 21 | **Automated tests** | Frontend + more backend integration tests | Backend 3 tests |
| 22 | **Docker + CI/CD** | Deploy pipeline | Manual local dev |
| 23 | **NPM library / code generator** | Export forms as embeddable package | Not started |

---

## How to Run

1. Start MongoDB (local or Atlas).
2. Backend: `cd Form_Management_Service && npm run dev` (port **3004**, requires `JWT_SECRET`).
3. Frontend: `cd Jay_2 && npm run dev`.
4. Set `NEXT_PUBLIC_API_URL=http://localhost:3004` if needed (default in `simpleApiConfig.js`).

---

## Recommended Direction

**Do not rewrite from scratch.** The core is solid. Highest-leverage path:

1. **Finalize Form Builder** — one primary editor experience
2. **Productize Field Options + Theme Editor** — when builder is stable
3. **Production hardening** — email provider, tests, optional soft delete
4. **SaaS layer** — billing, full analytics dashboard, webhooks

Suggested order:

```
Now:       Form Builder polish + Field Options / Theme Editor (dev → product)
Next:      Platform themes, merge Builder Lab, email provider, tests
Later:     Billing, analytics dashboard, webhooks, soft delete
```

---

## Bottom Line

**Good:** Feature-rich form builder with auth, workspaces, submissions, versioning, field-options API, and audit logs.

**In progress:** Form Builder UX, Field Options and Theme Editor as first-class modules (currently dev tabs).

**Later:** Email provider, platform themes, SaaS features (billing, full analytics, webhooks, soft delete).

---

## Related Docs

- [README.md](./README.md) — setup
- [BACKEND_DEPTH_PLAN.md](./BACKEND_DEPTH_PLAN.md) — backend status
- [Form_Management_Service/README.md](./Form_Management_Service/README.md) — API reference
- [Jay_2/design-reference/README.md](./Jay_2/design-reference/README.md) — static layout mocks
- [documents/README.md](./documents/README.md) — doc index
