## Netlify Deployment Details

### Core Settings
Setting | Value
------- | -----
Build command | `npm run build`
Publish directory | `public`
Functions directory | `netlify/functions`
Node version | 18+ (configure in Netlify if needed)

### Environment Variables
Configure before triggering build. Key vars: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs, `REQUIRE_API_KEY`.

### Redirects / Headers
If you need custom headers, add a `_headers` file under `public/` or use Netlify UI. Typical CORS is handled in functions; static assets can add caching headers.

### Function Cold Starts
Lightweight—dataset loaded once per warm container. For very large private dataset consider splitting into shards or pre-compiling an index.

### Rollbacks
Netlify keeps previous deploys; use UI “Publish deploy” to roll back instantly.

### Custom Domains & HTTPS
Add domain in Netlify; automatic Let’s Encrypt certificate provided. Update marketing references accordingly.

### Observability
- Netlify function logs for runtime errors
- Consider external logging (Sentry) by wrapping handlers

### Edge Functions (Optional)
Could layer simple auth gating or request normalization at the edge. Not required for baseline deployment.

End.