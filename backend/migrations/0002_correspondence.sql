-- Pass 14: private, immutable correspondence threads and sent snapshots.
BEGIN;

ALTER TABLE profiles ADD COLUMN email text;
CREATE UNIQUE INDEX profiles_email_normalized_unique
  ON profiles (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE correspondence_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  subject varchar(100) NOT NULL CHECK (length(trim(subject)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX correspondence_threads_activity_idx
  ON correspondence_threads (last_message_at DESC, id DESC);

CREATE TABLE correspondence_participants (
  thread_id uuid NOT NULL REFERENCES correspondence_threads(id) ON DELETE RESTRICT,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('sender','recipient')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  PRIMARY KEY (thread_id, profile_id)
);
CREATE INDEX correspondence_participants_profile_idx
  ON correspondence_participants (profile_id, thread_id);

CREATE TABLE correspondence_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES correspondence_threads(id) ON DELETE RESTRICT,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  creation_id uuid,
  creation_revision integer,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((creation_id IS NULL) = (creation_revision IS NULL))
);
CREATE INDEX correspondence_messages_thread_idx
  ON correspondence_messages (thread_id, created_at ASC, id ASC);

CREATE TABLE asset_thread_grants (
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  thread_id uuid NOT NULL REFERENCES correspondence_threads(id) ON DELETE RESTRICT,
  granted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id, thread_id)
);

CREATE OR REPLACE FUNCTION lumie_find_recipient_by_email(recipient_email text)
RETURNS TABLE (profile_id uuid, display_name varchar)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.display_name
  FROM profiles p
  WHERE NULLIF(current_setting('app.user_id', true), '') IS NOT NULL
    AND p.deleted_at IS NULL
    AND lower(p.email) = lower(trim(recipient_email))
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION lumie_find_recipient_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lumie_find_recipient_by_email(text) TO lumie_app;

ALTER TABLE correspondence_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondence_threads FORCE ROW LEVEL SECURITY;
CREATE POLICY correspondence_threads_member_read ON correspondence_threads
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM correspondence_participants cp
    WHERE cp.thread_id = correspondence_threads.id
      AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  ));
CREATE POLICY correspondence_threads_creator_read ON correspondence_threads
  FOR SELECT USING (created_by = NULLIF(current_setting('app.user_id', true), '')::uuid);
CREATE POLICY correspondence_threads_creator_insert ON correspondence_threads
  FOR INSERT WITH CHECK (created_by = NULLIF(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE correspondence_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondence_participants FORCE ROW LEVEL SECURITY;
CREATE POLICY correspondence_participants_member_read ON correspondence_participants
  FOR SELECT USING (profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid);
CREATE POLICY correspondence_participants_thread_creator_insert ON correspondence_participants
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM correspondence_threads t
    WHERE t.id = thread_id
      AND t.created_by = NULLIF(current_setting('app.user_id', true), '')::uuid
  ));
CREATE POLICY correspondence_participants_self_update ON correspondence_participants
  FOR UPDATE USING (profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid)
  WITH CHECK (profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid);

ALTER TABLE correspondence_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE correspondence_messages FORCE ROW LEVEL SECURITY;
CREATE POLICY correspondence_messages_member_read ON correspondence_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM correspondence_participants cp
    WHERE cp.thread_id = correspondence_messages.thread_id
      AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  ));
CREATE POLICY correspondence_messages_member_insert ON correspondence_messages
  FOR INSERT WITH CHECK (
    sender_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM correspondence_participants cp
      WHERE cp.thread_id = asset_thread_grants.thread_id
        AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

ALTER TABLE asset_thread_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_thread_grants FORCE ROW LEVEL SECURITY;
CREATE POLICY asset_thread_grants_member_read ON asset_thread_grants
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM correspondence_participants cp
    WHERE cp.thread_id = asset_thread_grants.thread_id
      AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  ));
CREATE POLICY asset_thread_grants_owner_insert ON asset_thread_grants
  FOR INSERT WITH CHECK (
    granted_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (SELECT 1 FROM assets a WHERE a.id = asset_id AND a.owner_id = granted_by AND a.status = 'ready')
    AND EXISTS (
      SELECT 1 FROM correspondence_participants cp
      WHERE cp.thread_id = asset_thread_grants.thread_id
        AND cp.profile_id = granted_by
    )
  );

-- Recipients may fetch only assets explicitly shared through a thread they belong to.
DROP POLICY assets_owner_read ON assets;
CREATE POLICY assets_owner_or_correspondence_read ON assets
  FOR SELECT USING (
    owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR EXISTS (
      SELECT 1 FROM asset_thread_grants g
      JOIN correspondence_participants cp ON cp.thread_id = g.thread_id
      WHERE g.asset_id = id
        AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

CREATE POLICY correspondence_threads_member_update ON correspondence_threads
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM correspondence_participants cp
    WHERE cp.thread_id = correspondence_threads.id
      AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM correspondence_participants cp
    WHERE cp.thread_id = correspondence_threads.id
      AND cp.profile_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  ));

COMMIT;
