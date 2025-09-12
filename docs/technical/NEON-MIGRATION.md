## Migration Notes (Supabase → Neon)

### Differences
- Supabase RLS policies removed (not needed for internal key mgmt).
- Functions recreated in pure PL/pgSQL without security definer reliance.

### Steps Followed
1. Exported core tables (users, api_keys, api_usage) schema.
2. Rebuilt schema in Neon (`neon/schema.sql`).
3. Added subscription extensions via `neon/subscription-schema.sql`.
4. Updated code to use `@neondatabase/serverless` instead of Supabase JS client.
5. Migrated data: hashed keys & usage rows imported (optional).

### Post-Migration Validation
Checklist:
- [ ] Key generation works
- [ ] Validation decrements counts
- [ ] Monthly reset logic triggers across month boundary test
- [ ] Webhook updates tiers & suspension

### Future DB Evolution
Add indexed search table for awards or move to vector similarity for fuzzy queries once dataset is DB-backed.

End.