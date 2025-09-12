## Neon Quick Deploy (TL;DR)

```bash
# Create Neon project (UI)
# Set password / get connection string
psql "$DATABASE_URL" -f neon/schema.sql
psql "$DATABASE_URL" -f neon/subscription-schema.sql
psql "$DATABASE_URL" -f neon/seed.sql   # optional
```

Add `DATABASE_URL` to Netlify → deploy.

End.