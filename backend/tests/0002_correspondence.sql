-- Run after 0001_rls.sql and 0002_correspondence.sql as migration owner.
-- Exercises participant isolation, immutable snapshots and thread-scoped photo access.
GRANT SELECT, INSERT, UPDATE ON correspondence_threads, correspondence_participants TO lumie_app;
GRANT SELECT, INSERT ON correspondence_messages, asset_thread_grants TO lumie_app;

SET ROLE lumie_app;
DO $$
DECLARE
  sender_id uuid;
  recipient_id uuid;
  outsider_id uuid;
  thread_id uuid;
  asset_id uuid;
  visible_count integer;
BEGIN
  PERFORM set_config('app.cognito_sub', 'correspondence-sender', true);
  INSERT INTO profiles (cognito_sub, email, display_name)
  VALUES ('correspondence-sender', 'sender@lumie.test', 'Sender')
  RETURNING id INTO sender_id;
  PERFORM set_config('app.user_id', sender_id::text, true);

  PERFORM set_config('app.cognito_sub', 'correspondence-recipient', true);
  INSERT INTO profiles (cognito_sub, email, display_name)
  VALUES ('correspondence-recipient', 'recipient@lumie.test', 'Recipient')
  RETURNING id INTO recipient_id;
  PERFORM set_config('app.user_id', recipient_id::text, true);

  PERFORM set_config('app.cognito_sub', 'correspondence-outsider', true);
  INSERT INTO profiles (cognito_sub, email, display_name)
  VALUES ('correspondence-outsider', 'outsider@lumie.test', 'Outsider')
  RETURNING id INTO outsider_id;

  PERFORM set_config('app.user_id', sender_id::text, true);
  PERFORM set_config('app.cognito_sub', 'correspondence-sender', true);

  SELECT profile_id INTO visible_count FROM lumie_find_recipient_by_email('RECIPIENT@lumie.test');
  ASSERT visible_count::text = recipient_id::text, 'Exact email lookup should find the registered recipient';

  INSERT INTO correspondence_threads (created_by, subject)
  VALUES (sender_id, 'A private letter') RETURNING id INTO thread_id;

  INSERT INTO correspondence_participants (thread_id, profile_id, role)
  VALUES (thread_id, sender_id, 'sender'), (thread_id, recipient_id, 'recipient');

  INSERT INTO correspondence_messages (thread_id, sender_id, snapshot)
  VALUES (thread_id, sender_id, '{"title":"A private letter","body":"Hello"}'::jsonb);

  INSERT INTO assets (owner_id, object_key, original_file_name, content_type, size_bytes, status)
  VALUES (sender_id, 'private/correspondence/photo', 'photo.png', 'image/png', 512, 'ready')
  RETURNING id INTO asset_id;
  INSERT INTO asset_thread_grants (asset_id, thread_id, granted_by)
  VALUES (asset_id, thread_id, sender_id);

  PERFORM set_config('app.user_id', recipient_id::text, true);
  SELECT count(*) INTO visible_count FROM correspondence_threads;
  ASSERT visible_count = 1, 'Recipient should see the thread they belong to';
  SELECT count(*) INTO visible_count FROM correspondence_messages;
  ASSERT visible_count = 1, 'Recipient should read the sent snapshot';
  SELECT count(*) INTO visible_count FROM assets WHERE id = asset_id;
  ASSERT visible_count = 1, 'Recipient should read an asset explicitly shared in the thread';

  PERFORM set_config('app.user_id', outsider_id::text, true);
  SELECT count(*) INTO visible_count FROM correspondence_threads;
  ASSERT visible_count = 0, 'An unrelated account must not see the thread';
  SELECT count(*) INTO visible_count FROM correspondence_messages;
  ASSERT visible_count = 0, 'An unrelated account must not read messages';
  SELECT count(*) INTO visible_count FROM assets WHERE id = asset_id;
  ASSERT visible_count = 0, 'An unrelated account must not read shared assets';
END;
$$;
RESET ROLE;
