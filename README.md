# Form Builder

Dynamic form builder platform — visual editor, API backend, auth, workspaces, and submissions.

## Project Structure

```
form_builder/
├── Jay_2/                      # Next.js 14 frontend
├── Form_Management_Service/    # Express + MongoDB API
├── documents/                  # Reference docs (auth, API standards)
├── PROJECT_ANALYSIS.md         # Full project snapshot
└── BACKEND_DEPTH_PLAN.md       # Backend roadmap & status
```

## Quick Start

### 1. Backend

```bash
cd Form_Management_Service
cp .env.example .env          # set JWT_SECRET
npm install
npm run dev                   # http://localhost:3004
```

Requires MongoDB running locally or via `MONGODB_URI`.

### 2. Frontend

```bash
cd Jay_2
npm install
npm run dev                   # http://localhost:3000
```

Optional: `NEXT_PUBLIC_API_URL=http://localhost:3004`

### 3. Use the app

1. Register / login at `http://localhost:3000`
2. **Form Manager** → create/edit in **Form Builder** (or **Builder Lab** for experiments)
3. **Preview** from the list (saved form) or **Build | Preview** inside the builder (live draft)
4. **Submissions** — view responses, export, basic analytics charts

**Dev tabs** (admin / workspace owner): Field Options, Theme Editor — APIs work; full UI coming later.

## Documentation

| Doc | Purpose |
|-----|---------|
| [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) | Current state, strengths, gaps, backlog |
| [BACKEND_DEPTH_PLAN.md](./BACKEND_DEPTH_PLAN.md) | Backend architecture & completed work |
| [Form_Management_Service/README.md](./Form_Management_Service/README.md) | API routes, env vars, tests |
| [Jay_2/README.md](./Jay_2/README.md) | Frontend features & usage |
| [documents/README.md](./documents/README.md) | Index of reference docs |

## Tests

```bash
cd Form_Management_Service && npm test
cd Jay_2 && npm run lint
```

## License

MIT
