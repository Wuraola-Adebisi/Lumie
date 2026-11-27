-- Lumie backend foundation: profiles, cloud creations, immutable revisions and assets.
-- PostgreSQL 15+. Apply with a migration owner; the application runtime must use a separate role.
BEGIN;

CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub text NOT NULL UNIQUE,
  display_name varchar(80) NOT NULL DEFAULT '',
  avatar_asset_id uuid,
  locale varchar(35) NOT NULL DEFAULT 'en',
  time_zone varchar(64) NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title varchar(80) NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 80),
  format text NOT NULL CHECK (format IN ('letter', 'postcard', 'photo-card', 'collage', 'memory')),
  document_schema_version smallint NOT NULL DEFAULT 2 CHECK (document_schema_version = 2),
  document_json jsonb NOT NULL CHECK (jsonb_typeof(document_json) = 'object'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (owner_id, id)
);

CREATE INDEX creations_owner_updated_idx
  ON creations (owner_id, updated_at DESC, id DESC)
  WHERE archived_at IS NULL;

CREATE TABLE creation_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creation_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision >= 1),
  document_json jsonb NOT NULL CHECK (jsonb_typeof(document_json) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creation_revisions_creation_owner_fk
    FOREIGN KEY (owner_id, creation_id)
    REFERENCES creations (owner_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT creation_revisions_unique_number UNIQUE (creation_id, revision)
);

CREATE INDEX creation_revisions_owner_creation_idx
  ON creation_revisions (owner_id, creation_id, revision DESC);

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  object_key text NOT NULL UNIQUE,
  original_file_name varchar(180) NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
  size_bytes bigint NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  checksum_sha256 char(64),
  width integer CHECK (width IS NULL OR width BETWEEN 1 AND 12000),
  height integer CHECK (height IS NULL OR height BETWEEN 1 AND 12000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'rejected', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (owner_id, id)
);

CREATE INDEX assets_owner_created_idx ON assets (owner_id, created_at DESC);

ALTER TABLE profiles
  ADD CONSTRAINT profiles_avatar_asset_owner_fk
  FOREIGN KEY (id, avatar_asset_id)
  REFERENCES assets (owner_id, id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER creations_set_updated_at
  BEFORE UPDATE ON creations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER assets_set_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- During first-login provisioning, the trusted API sets app.cognito_sub from
-- the verified JWT, reads/inserts only that profile, then sets app.user_id to
-- the returned internal UUID for the rest of the transaction. Both settings
-- are transaction-local and must never come from request-body fields.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_select ON profiles
  FOR SELECT
  USING (
    id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR cognito_sub = NULLIF(current_setting('app.cognito_sub', true), '')
  );
CREATE POLICY profiles_self_insert ON profiles
  FOR INSERT
  WITH CHECK (cognito_sub = NULLIF(current_setting('app.cognito_sub', true), ''));
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creations FORCE ROW LEVEL SECURITY;
CREATE POLICY creations_owner_access ON creations
  USING (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE creation_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creation_revisions FORCE ROW LEVEL SECURITY;
CREATE POLICY creation_revisions_owner_read ON creation_revisions
  FOR SELECT
  USING (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid);
CREATE POLICY creation_revisions_owner_insert ON creation_revisions
  FOR INSERT
  WITH CHECK (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid);
-- Revisions are immutable: no UPDATE or DELETE policy is granted.

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
CREATE POLICY assets_owner_access ON assets
  USING (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

COMMIT;
