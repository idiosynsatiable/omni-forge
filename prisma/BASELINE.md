# Prisma migration baseline adoption

Omni-Forge previously had a Prisma schema but no committed migration history. `000_baseline` captures the pre-hardening schema exactly; `001_tenant_generation_recovery` is the first additive hardening migration.

## Fresh database

Run:

```bash
npx prisma migrate deploy
```

Prisma will apply the baseline and all later migrations.

## Existing database that already has the pre-hardening tables

1. Take and verify a database backup.
2. Confirm the existing schema matches the pre-hardening baseline.
3. Mark only the baseline as already applied:

```bash
npx prisma migrate resolve --applied 000_baseline
```

4. Apply real migrations:

```bash
npx prisma migrate deploy
```

5. Run `npx prisma migrate status` and the application readiness check.

Do not use `prisma db push` in production. Do not mark `001_tenant_generation_recovery` applied manually. Existing `App` rows receive `organizationId=0` and remain quarantined until a deliberate, audited ownership migration is performed.
