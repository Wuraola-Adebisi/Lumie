-- Minimal Supabase auth-role scaffolding for the email notification migration test.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- The production Supabase schema adds this column in its scheduled-correspondence migration.
ALTER TABLE correspondence_messages
  ADD COLUMN available_at timestamptz NOT NULL DEFAULT now();
