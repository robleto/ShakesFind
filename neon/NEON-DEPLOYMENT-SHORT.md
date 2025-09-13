# Neon Quick Deployment (TL;DR) – v2 Shakespeare Productions

1. Create Neon project → copy connection string
2. Run `neon/schema.sql` in SQL Editor
3. Set Netlify env vars:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
REQUIRE_API_KEY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```
4. Netlify settings:
- Build: `npm run build`
- Functions: `netlify/functions`
- Publish: `public`

5. Deploy (push to `main` → Netlify auto-build)
6. Test endpoints:
```
/health
/api/?i=prod_1&apikey=demo
/api/?s=Hamlet&year=2025&apikey=demo
/api/productions?page=1&pageSize=5&apikey=demo
```
7. Generate real key via `/apikey` form.

## Validate DB Functions
```sql
SELECT generate_api_key('test@example.com');
SELECT validate_api_key('paste_generated_key');
```

## Migrate From Supabase
- Remove old env vars (SUPABASE_*)
- Confirm no `@supabase/supabase-js` dependency (already removed)
- Use `NEON-MIGRATION.md` for detailed steps

Done. Your Neon-backed Shakespeare Productions API is production ready.
