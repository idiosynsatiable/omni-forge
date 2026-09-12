# Omni-Forge

> **Status: experimental public prototype.** This repository contains working application code and verifiable quality commands, but it is not presented as a production release.

Omni-Forge is the intended construction component in the E11EVEN ecosystem. It explores application planning, generation, validation, marketplace cataloguing, deployment-readiness checks, and Cash-SaaS integration from a Next.js control surface.

## Relationship to E11EVEN PRIME

- **Command Center Pro** is the proprietary flagship application and control plane.
- **Omni-Forge** is an experimental supporting construction component.
- **Cash-SaaS Core** is the intended billing and usage-accounting component.
- **TITAN** is maintained in the private Command Center Pro source tree, not in this repository.

Code-level routes and connectors show intended integration boundaries. They are not, by themselves, proof that an external service is deployed, configured, or healthy.

## Requirements

- Node.js 24
- npm 10.9.8
- PostgreSQL for database-backed development paths

The committed `package-lock.json` is authoritative. Use npm; do not introduce a second lockfile.

## Local development

Use a dedicated local or disposable development database. Never point these commands at staging or production.

```bash
npm ci
cp .env.example .env
# Set DATABASE_URL in .env to an isolated PostgreSQL database.
npm run prisma:generate
npm run prisma:push
npm run dev
```

The development server starts at `http://localhost:3000`. Runtime features that call OpenAI, Stripe, Redis, or Cash-SaaS remain disabled or degraded until their documented variables are configured.

## Quality commands

```bash
npm run typecheck
npm test
npm run build
```

`npm run verify` runs the same typecheck, real assertion suite, and production build in sequence. Tests use Node's built-in test runner through the repository's existing `tsx` dependency; no competing test framework is introduced.

## Environment

See [`.env.example`](./.env.example) for variable names. Keep secrets out of commits and use isolated development values.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection for the isolated development database |
| `NEXT_PUBLIC_APP_URL` | Local application origin |
| `OPENAI_API_KEY` | Optional provider access |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional billing integration |
| `REDIS_URL` | Optional Redis integration |
| `CASH_SAAS_CORE_URL` / `CASH_SAAS_ADMIN_API_KEY` | Optional Cash-SaaS integration |

## Runtime inspection

- `/api/health` reports liveness and configured subsystem state.
- `/api/ready` reports whether required runtime dependencies are ready.

These endpoints describe the running revision only when exercised against that exact deployment.
