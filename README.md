# Agent Memory Hub

**Agent Memory Hub** is a small research-facing web app for exploring the agent memory ecosystem.

The current app, **Memory Router**, lets you browse memory frameworks, inspect repository metadata, review structured Q&A extracted for each project, and compare multiple systems side by side.

## What this repo does

- Indexes memory-related frameworks with repository metadata such as stars, forks, language, license, and last update time
- Organizes frameworks with tags and paper links
- Shows per-framework detail pages with extracted Q&A and diagrams
- Supports side-by-side comparison across multiple frameworks
- Exposes internal API routes that power the frontend search and filtering experience

## Tech stack

- Next.js
- React
- TypeScript
- PostgreSQL via `pg`
- Supabase-hosted Postgres through `DATABASE_URL`

## Repository layout

At the moment, the repository is centered around a single Next.js app:

```text
.
├── frontend/                  # Memory Router web application
│   ├── src/app/               # App routes, pages, and API handlers
│   ├── src/components/        # UI building blocks
│   ├── src/lib/               # Data access and domain helpers
│   ├── public/                # Static assets
│   └── README.md              # Frontend-specific notes
└── README.md                  # Repository overview
```

## Key user flows

### Browse frameworks

The framework index supports search, filtering, and pagination over tracked memory projects.

### Inspect a framework

Each framework page combines repository signals with structured Q&A, tags, links, and other summary metadata.

### Compare systems

The compare view helps you inspect trade-offs across selected frameworks in one place.

## Local development

### Prerequisites

- Node.js 20+ recommended
- npm
- A reachable Postgres database connection string

### Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Then set `DATABASE_URL` in `frontend/.env.local`.

### Run the app

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

From `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## API surface

The frontend currently uses internal API routes under `frontend/src/app/api/`, including:

- `/api/frameworks`
- `/api/frameworks/[frameworkId]`
- `/api/compare`

## Notes

- The app expects `DATABASE_URL` to be configured for data-backed pages and API routes.
- `frontend/README.md` contains a shorter app-specific setup note.

## License

No repository-level license file is included yet.
