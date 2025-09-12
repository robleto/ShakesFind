# Neon Database Migration Guide

## Overview
This guide walks you through migrating the Game Awards API from Supabase to Neon, a modern serverless PostgreSQL platform.

## Why Neon?

### Cost Benefits for Multiple Projects
- **10 free projects** (vs Supabase's 2)
- **Usage-based pricing** rather than per-project pricing
- **Generous free tier**: 0.5 GB storage, 10 hours compute/month per project
- **No credit card required** for free tier

### Technical Benefits
- **Serverless PostgreSQL** with automatic scaling
- **Branching** - create database branches like Git branches
- **Fast cold starts** and connection pooling
- **Full PostgreSQL compatibility**

## Migration Steps

### 1. Create Neon Account
1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub (recommended for developers)
3. Create a new project called "game-awards-api"

### 2. Get Database Connection String
1. In your Neon dashboard, go to your project
2. Click "Connection Details" 
3. Copy the connection string that looks like:
   ```
   postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```

### 3. Update Environment Variables
Update your `.env` file:
```env
# Replace Supabase variables with:
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
```

### 4. Run Database Schema
Execute the schema to create your tables and functions:

**Option A: Via Neon Console**
1. Go to your Neon project dashboard
2. Click "SQL Editor"
3. Copy and paste the contents of `neon/schema.sql`
4. Click "Run"

**Option B: Via Command Line (if you have psql)**
```bash
psql "postgresql://[user]:[password]@[host]/[dbname]?sslmode=require" -f neon/schema.sql
```

### 5. Test the Migration
```bash
npm test
npm run dev
```

## Environment Variables Comparison

### Before (Supabase)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### After (Neon)
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
```

## Code Changes Summary

### Dependencies
- **Removed**: `@supabase/supabase-js`
- **Added**: `pg`, `@neondatabase/serverless`

### Database Layer
- **New file**: `config/database.js` - Unified database interface
- **Schema**: `neon/schema.sql` - PostgreSQL schema without Supabase-specific features

### API Functions
All Netlify functions automatically use the new database layer through the updated imports.

## Deployment Updates

### Netlify Environment Variables
In your Netlify dashboard, update:
1. Remove: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. Add: `DATABASE_URL` with your Neon connection string

### Production Considerations
- **Connection Pooling**: Neon automatically handles this
- **SSL**: Always enabled, required in connection string
- **Regions**: Choose the region closest to your Netlify deployment
- **Backup**: Neon provides automatic backups in all plans

## Performance Benefits

### Neon Advantages
- **Lower latency**: Especially with Neon's edge locations
- **Auto-scaling**: Scales to zero when not in use
- **Connection pooling**: Built-in, no configuration needed
- **Branching**: Create dev/staging branches of your database

### Cost Comparison (Monthly)
| Feature | Supabase Free | Neon Free |
|---------|---------------|-----------|
| Projects | 2 | 10 |
| Storage | 500 MB | 500 MB |
| Compute | 2 CPU hours | 10 CPU hours |
| API Requests | 5M | No limit* |
| Pricing Model | Per project | Usage-based |

*Limited by compute hours

## Migration Verification

After migration, verify these endpoints work:
- `GET /api/health` - Database connectivity
- `POST /api/generate-key` - API key generation
- `GET /api/v1/awards` - Awards data with API key validation

## Troubleshooting

### Common Issues
1. **Connection timeout**: Check if DATABASE_URL includes `?sslmode=require`
2. **Schema errors**: Ensure all functions were created successfully
3. **Environment variables**: Verify DATABASE_URL is set in both local `.env` and Netlify

### Support
- **Neon Docs**: [neon.tech/docs](https://neon.tech/docs)
- **Discord**: [Neon Community](https://discord.gg/92vNTzKDGp)
- **Status**: [status.neon.tech](https://status.neon.tech)

## Next Steps

After successful migration:
1. **Test thoroughly** in development
2. **Deploy to Netlify** with new environment variables
3. **Monitor performance** in Neon dashboard
4. **Consider setting up database branching** for dev/staging environments
5. **Migrate other projects** using the same pattern
