## Neon Connection Guide

### Connection String Format
`postgresql://USER:PASSWORD@HOST/dbname?sslmode=require`

Neon often supplies a URI with `?sslmode=require`. Keep it—Netlify function environment uses TLS automatically.

### Performance Tips
- Use serverless driver `@neondatabase/serverless` (already implemented) for HTTP/WS transport.
- Batch related updates (avoid multiple round trips during single request where possible).

### Schema Files
File | Purpose
---- | -------
`neon/schema.sql` | Base tables + functions (initial key generation & validation)
`neon/subscription-schema.sql` | Subscription columns & enhanced validation
`neon/seed.sql` | Demo seed data

### Local psql Access
```bash
psql "$DATABASE_URL" -c "\dt"
```

### Branching (Neon Feature)
Use branches for staging migrations, then diff & merge or promote to production. Always apply new SQL in order.

### Connection Pooling
Serverless driver internally multiplexes; external pooling (pgBouncer) typically unnecessary.

### Timeouts / Retries
Wrap critical calls with retry (e.g., subscription limit updates) if transient errors appear. Add exponential backoff for idempotent operations.

End.