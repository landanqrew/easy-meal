# Easy Meal

A web application that streamlines meal preparation — from AI-powered recipe creation to grocery list generation and community sharing.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query
- **Backend**: Bun, Hono, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (email/password + Google OAuth)
- **AI**: Google Gemini (recipe generation)
- **Deployment**: Google Cloud Run
- **Monorepo**: Bun workspaces (`packages/api`, `packages/web`, `packages/shared`)

## Architecture

```
packages/
├── api/          # Hono API server (Bun runtime, port 3001)
│   └── src/
│       ├── db/           # Drizzle schema and connection
│       ├── lib/          # Auth, AI, utilities
│       ├── middleware/   # Error handling, security
│       └── routes/       # API endpoints
├── web/          # React SPA (Vite, port 5173)
│   └── src/
│       ├── lib/          # Auth client, theme
│       └── pages/        # Page components
└── shared/       # Shared TypeScript types
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both API and web dev servers |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | ESLint across all packages |
| `bun run db:push` | Push Drizzle schema to database |
| `bun run db:studio` | Open Drizzle Studio GUI |

No test suite is configured yet.

## Design System

See `design.md` for the full design system. Key points:
- Warm, culinary-inspired aesthetic (terracotta, sage, earth tones)
- Background: `#FAF5E9` (creamy off-white), Primary: `#D08770` (terracotta)
- Theme defined in `packages/web/src/lib/theme.ts` and CSS variables in `packages/web/src/index.css`
- Soft shadows, rounded corners, "lift on hover" interaction pattern

## Constraints

- All recipes are household-scoped; enforce household authorization on all data access
- AI generation uses structured preference selection (not free-text prompts)
- No test suite yet — verify changes manually or via typecheck
- Database runs on port 5433 (not default 5432) to avoid conflicts

## Current Priorities

1. [Review and define priorities]
