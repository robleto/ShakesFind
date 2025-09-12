-- Game Awards API Database Schema for Neon
-- This schema creates tables for user management, API keys, and usage tracking

-- Users table for API key management
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  use_case TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  key_preview TEXT NOT NULL, -- First 8 characters for display
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'professional', 'enterprise')),
  requests_remaining INTEGER DEFAULT 1000,
  requests_total INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 1000,
  monthly_limit INTEGER DEFAULT NULL,
  last_request_at TIMESTAMP WITH TIME ZONE,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- API Usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  parameters JSONB,
  response_time_ms INTEGER,
  status_code INTEGER DEFAULT 200,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage(api_key);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  user_email TEXT, 
  user_name TEXT DEFAULT NULL, 
  user_company TEXT DEFAULT NULL, 
  user_use_case TEXT DEFAULT NULL, 
  user_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id UUID;
  new_key TEXT;
  key_hash TEXT;
  key_preview TEXT;
BEGIN
  -- Generate API key (gaa_ prefix + 32 random chars)
  new_key := 'gaa_' || encode(gen_random_bytes(24), 'base64');
  new_key := replace(replace(new_key, '+', ''), '/', '');
  new_key := substr(new_key, 1, 36);
  
  key_hash := encode(digest(new_key, 'sha256'), 'hex');
  key_preview := substr(new_key, 1, 8) || '...';

  -- Insert or get user
  INSERT INTO users (email, name, company, use_case, description)
  VALUES (user_email, user_name, user_company, user_use_case, user_description)
  ON CONFLICT (email) 
  DO UPDATE SET 
    name = COALESCE(EXCLUDED.name, users.name),
    company = COALESCE(EXCLUDED.company, users.company),
    use_case = COALESCE(EXCLUDED.use_case, users.use_case),
    description = COALESCE(EXCLUDED.description, users.description),
    updated_at = NOW()
  RETURNING id INTO new_user_id;

  -- Insert API key
  INSERT INTO api_keys (user_id, key_hash, key_preview)
  VALUES (new_user_id, key_hash, key_preview);

  RETURN json_build_object(
    'success', true,
    'api_key', new_key,
    'preview', key_preview,
    'tier', 'free',
    'daily_limit', 1000
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Function to validate and track API key usage
CREATE OR REPLACE FUNCTION validate_api_key(key_to_check TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  key_hash TEXT;
  key_record RECORD;
BEGIN
  -- Hash the provided key
  key_hash := encode(digest(key_to_check, 'sha256'), 'hex');

  -- Get key record
  SELECT * INTO key_record
  FROM api_keys
  WHERE api_keys.key_hash = validate_api_key.key_hash
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid API key'
    );
  END IF;

  -- Check if we need to reset daily limits
  IF DATE(key_record.last_reset_at) < CURRENT_DATE THEN
    UPDATE api_keys
    SET 
      requests_remaining = daily_limit,
      last_reset_at = NOW()
    WHERE id = key_record.id;
    
    key_record.requests_remaining := key_record.daily_limit;
  END IF;

  -- Check rate limits
  IF key_record.requests_remaining <= 0 THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Rate limit exceeded'
    );
  END IF;

  -- Decrement usage
  UPDATE api_keys
  SET 
    requests_remaining = requests_remaining - 1,
    requests_total = requests_total + 1,
    last_request_at = NOW()
  WHERE id = key_record.id;

  RETURN json_build_object(
    'valid', true,
    'tier', key_record.tier,
    'requests_remaining', key_record.requests_remaining - 1,
    'daily_limit', key_record.daily_limit
  );
END;
$$;
