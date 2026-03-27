Agent Memory Hub frontend built with [Next.js](https://nextjs.org).

## Getting Started

1) Configure database connection (Supabase pooler):

```bash
cp .env.example .env.local
```

2) Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Data Flow

- UI reads from internal API routes:
  - `GET /api/entities`
  - `GET /api/entities/[entityId]`
  - `GET /api/compare`
- API routes query Supabase Postgres through `DATABASE_URL`.
- If `DATABASE_URL` is missing, the app falls back to local mock data for development.
