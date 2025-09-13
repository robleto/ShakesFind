-- Neon seed data (adapted from Supabase seed) - updated for Shakespeare Productions API
-- Insert demo users
INSERT INTO users (id, email, name, company, use_case, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@shakesfind.com', 'Demo User', 'Shakespeare Productions API', 'testing', 'Demo account for testing'),
  ('00000000-0000-0000-0000-000000000002', 'developer@shakesfind.com', 'Jane Developer', 'Indie Theatre Apps', 'mobile_app', 'Building a production discovery app'),
  ('00000000-0000-0000-0000-000000000003', 'research@shakesfind.com', 'Dr. Theatre Scholar', 'University Research', 'research', 'Academic study on Shakespeare production trends')
ON CONFLICT (email) DO NOTHING;

-- Insert demo API keys (hashes only; raw keys not stored)
INSERT INTO api_keys (user_id, key_hash, key_preview, tier, daily_limit, requests_remaining) VALUES
  ('00000000-0000-0000-0000-000000000001', encode(digest('gaa_demo_key_for_testing_only', 'sha256'), 'hex'), 'gaa_demo...', 'free', 1000, 1000),
  ('00000000-0000-0000-0000-000000000002', encode(digest('gaa_dev_key_for_mobile_app', 'sha256'), 'hex'), 'gaa_dev_...', 'professional', 100000, 100000),
  ('00000000-0000-0000-0000-000000000003', encode(digest('gaa_research_university_key', 'sha256'), 'hex'), 'gaa_rese...', 'enterprise', 1000000, 1000000)
ON CONFLICT (key_hash) DO NOTHING;

-- Sample usage rows
INSERT INTO api_usage (api_key, endpoint, parameters, status_code, timestamp) VALUES
  ('gaa_demo_key_for_testing_only', '/api/', '{"s": "hamlet"}', 200, now() - interval '1 hour'),
  ('gaa_demo_key_for_testing_only', '/api/', '{"city": "london"}', 200, now() - interval '2 hours'),
  ('gaa_dev_key_for_mobile_app', '/api/', '{"company": "royal"}', 200, now() - interval '30 minutes'),
  ('gaa_research_university_key', '/api/productions', '{}', 200, now() - interval '45 minutes')
ON CONFLICT DO NOTHING;

-- Sample productions (minimal)
INSERT INTO productions (play_title, company_name, venue_name, city, country, start_date, end_date, status, ticket_url, official_url, synopsis)
VALUES
  ('Hamlet', 'Royal Shakespeare Company', 'Swan Theatre', 'Stratford-upon-Avon', 'UK', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '2 months', 'upcoming', 'https://tickets.example/hamlet-rsc', 'https://rsc.org/hamlet', 'A prince struggles with revenge and mortality.'),
  ('Macbeth', 'Globe Theatre', 'Shakespeare''s Globe', 'London', 'UK', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '21 days', 'running', 'https://tickets.example/macbeth-globe', 'https://shakespearesglobe.com/macbeth', 'A Scottish general''s ambition leads to tragedy.'),
  ('Romeo and Juliet', 'Broadway Classics', 'Lyric Theatre', 'New York', 'USA', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '1 month', 'closed', 'https://tickets.example/romeo-juliet-bc', 'https://broadwayclassics.org/romeo-juliet', 'Star-crossed lovers defy their feuding families.');
