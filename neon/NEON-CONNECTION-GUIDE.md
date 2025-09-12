# Neon Database Connection Guide

## Connection String Format

For Neon, your DATABASE_URL should follow this format:



## Components:

- **username**: Your Neon database username (typically 'postgres' or whatever you set)
- **password**: Your Neon database password (reset this if compromised)
- **hostname**: The Neon hostname (format: ep-something-numbers.region.aws.neon.tech)
- **database**: Your database name (typically the project name or 'neondb')
- **sslmode=require**: Required for secure connections to Neon

## Finding Your Connection Details

1. Log in to your Neon account at https://console.neon.tech
2. Select your project
3. Go to the "Connection Details" tab
4. You'll see your connection string there

## Security Best Practices

1. Never commit your .env file to version control
2. Reset your password immediately if it was accidentally shared
3. Use different passwords for different database instances
4. Consider using connection pooling for production environments

## Verifying Connection

Test your connection with:

```bash
node -e "require('./config/database').healthCheck().then(console.log)"
```

If successful, you should see:
```
{ timestamp: 2025-08-22T15:30:00.000Z, status: 'healthy' }
```

## Neon vs Supabase Differences

Neon is a serverless PostgreSQL service, while Supabase is a full Firebase alternative with PostgreSQL as its database. When migrating:

1. Direct SQL operations remain mostly the same
2. Authentication/storage features from Supabase need alternatives
3. The connection string format is different
4. Serverless environments (like Netlify Functions) work well with Neon's serverless design

## Environment Configuration

Remember to update your DATABASE_URL in:
1. Local .env file for development
2. Netlify environment variables for production
