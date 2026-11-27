-- Run after 0001_initial.sql as the database migration owner.
-- The runtime role is deliberately not a table owner and has no BYPASSRLS.
CREATE ROLE lumie_app NOLOGIN;
GRANT USAGE ON SCHEMA public TO lumie_app;
GRANT SELECT, INSERT, UPDATE ON profiles, creations, creation_revisions, assets TO lumie_app;

SET ROLE lumie_app;
DO $$
DECLARE
  profile_a uuid;
  profile_b uuid;
  creation_a uuid;
  creation_b uuid;
  visible_count integer;
  affected_count integer;
BEGIN
  PERFORM set_config('app.cognito_sub', 'subject-a', true);
  INSERT INTO profiles (cognito_sub, display_name)
  VALUES ('subject-a', 'Account A')
  RETURNING id INTO profile_a;
  PERFORM set_config('app.user_id', profile_a::text, true);

  INSERT INTO creations (owner_id, title, format, document_json)
  VALUES (profile_a, 'A private letter', 'letter', '{"schemaVersion":2}'::jsonb)
  RETURNING id INTO creation_a;

  INSERT INTO creation_revisions (creation_id, owner_id, revision, document_json)
  VALUES (creation_a, profile_a, 1, '{"schemaVersion":2}'::jsonb);

  INSERT INTO assets (owner_id, object_key, original_file_name, content_type, size_bytes)
  VALUES (profile_a, 'private/account-a/image-1', 'image.png', 'image/png', 512);

  PERFORM set_config('app.cognito_sub', 'subject-b', true);
  INSERT INTO profiles (cognito_sub, display_name)
  VALUES ('subject-b', 'Account B')
  RETURNING id INTO profile_b;
  PERFORM set_config('app.user_id', profile_b::text, true);

  INSERT INTO creations (owner_id, title, format, document_json)
  VALUES (profile_b, 'B private postcard', 'postcard', '{"schemaVersion":2}'::jsonb)
  RETURNING id INTO creation_b;

  INSERT INTO creation_revisions (creation_id, owner_id, revision, document_json)
  VALUES (creation_b, profile_b, 1, '{"schemaVersion":2}'::jsonb);

  PERFORM set_config('app.user_id', profile_a::text, true);
  PERFORM set_config('app.cognito_sub', 'subject-a', true);

  SELECT count(*) INTO visible_count FROM creations;
  ASSERT visible_count = 1, 'Account A must only see its own creation';

  SELECT count(*) INTO visible_count FROM profiles;
  ASSERT visible_count = 1, 'Account A must only see its own profile';

  SELECT count(*) INTO visible_count FROM assets;
  ASSERT visible_count = 1, 'Account A must only see its own assets';

  UPDATE creations SET title = 'Compromised' WHERE id = creation_b;
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  ASSERT affected_count = 0, 'Account A must not update Account B creation';

  UPDATE creation_revisions
  SET document_json = '{"changed":true}'::jsonb
  WHERE creation_id = creation_a AND revision = 1;
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  ASSERT affected_count = 0, 'Creation revisions must be immutable';

  SELECT count(*) INTO visible_count
  FROM creation_revisions
  WHERE creation_id = creation_a;
  ASSERT visible_count = 1, 'Account A must retain access to its own revision';
END;
$$;
RESET ROLE;
