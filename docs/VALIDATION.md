# Local validation (migrations + build + core tests)

## One-liner (recommended before deploy)

```powershell
Set-Location E:\path\to\tenvo-main
npm run validate
```

Runs, in order:

1. **`npm run validate:schema`** — `prisma validate`
2. **`npm run db:migrate`** — `prisma migrate deploy` (applies pending Prisma migrations only)
3. **`npm run validate:build`** — `next build` (compile + TypeScript + static generation)

## Targeted tests (fast signal)

```powershell
npm run test:integration
npx vitest run components/dashboard/widgets/__tests__/*.test.jsx lib/utils/__tests__/offlineQueue.test.js --reporter=dot
```

## Full test suite

```powershell
npx vitest run
```

Some legacy service tests (e.g. `AccountingService`, `VisionServices` quote→PO) may still fail until mocks and API surfaces are aligned; fix those incrementally.

## Supabase / manual SQL (not Prisma)

If the app expects tables or functions from **`lib/db/migrations/*.sql`**, run the relevant script in the SQL editor when Prisma history does not cover them. See **`docs/DATABASE_MIGRATIONS.md`**.
