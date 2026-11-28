-- Run after backend/supabase/migrations/0016_email_notification_outbox.sql.
DO $$
DECLARE
  sender_id uuid;
  recipient_id uuid;
  thread_id uuid;
  message_id uuid;
  queued_count integer;
  queued_available_at timestamptz;
  queued_status text;
  queued_attempts integer;
  scheduled_at timestamptz := now() + interval '2 hours';
BEGIN
  INSERT INTO profiles (cognito_sub, email, display_name)
  VALUES ('notification-sender', 'notification-sender@lumie.test', 'Sender')
  RETURNING id INTO sender_id;

  INSERT INTO profiles (cognito_sub, email, display_name)
  VALUES ('notification-recipient', 'notification-recipient@lumie.test', 'Recipient')
  RETURNING id INTO recipient_id;

  INSERT INTO correspondence_threads (created_by, subject)
  VALUES (sender_id, 'A private letter')
  RETURNING id INTO thread_id;

  INSERT INTO correspondence_participants (thread_id, profile_id, role)
  VALUES (thread_id, sender_id, 'sender'), (thread_id, recipient_id, 'recipient');

  INSERT INTO email_notification_preferences (user_id, email_correspondence)
  VALUES (recipient_id, false);

  INSERT INTO correspondence_messages (thread_id, sender_id, snapshot, available_at)
  VALUES (thread_id, sender_id, '{"title":"Private content must not enter email"}'::jsonb, now());

  SELECT count(*) INTO queued_count
  FROM email_notification_outbox
  WHERE recipient_profile_id = recipient_id;
  ASSERT queued_count = 0, 'Disabled correspondence email must not enqueue notifications';

  UPDATE email_notification_preferences
  SET email_correspondence = true
  WHERE user_id = recipient_id;

  INSERT INTO correspondence_messages (thread_id, sender_id, snapshot, available_at)
  VALUES (thread_id, sender_id, '{"title":"A second private letter"}'::jsonb, scheduled_at)
  RETURNING id INTO message_id;

  SELECT count(*) INTO queued_count
  FROM email_notification_outbox
  WHERE dedupe_key = 'correspondence:' || message_id::text || ':' || recipient_id::text;
  ASSERT queued_count = 1, 'A new correspondence message should enqueue exactly one recipient email';

  SELECT available_at, status INTO queued_available_at, queued_status
  FROM email_notification_outbox
  WHERE dedupe_key = 'correspondence:' || message_id::text || ':' || recipient_id::text;
  ASSERT queued_status = 'pending', 'New notifications should enter the pending queue';
  ASSERT queued_available_at >= scheduled_at, 'Scheduled correspondence notifications must wait until availability';

  SELECT count(*) INTO queued_count
  FROM lumie_claim_email_notification_batch(10);
  ASSERT queued_count = 0, 'A scheduled notification must not be claimable before its availability time';

  UPDATE email_notification_outbox
  SET available_at = now()
  WHERE dedupe_key = 'correspondence:' || message_id::text || ':' || recipient_id::text;

  SELECT count(*) INTO queued_count
  FROM lumie_claim_email_notification_batch(10);
  ASSERT queued_count = 1, 'A due notification should be claimable by the worker';

  SELECT status, attempts INTO queued_status, queued_attempts
  FROM email_notification_outbox
  WHERE dedupe_key = 'correspondence:' || message_id::text || ':' || recipient_id::text;
  ASSERT queued_status = 'processing' AND queued_attempts = 1, 'Claiming a notification should lock it and increment its attempt count';

  ASSERT NOT has_table_privilege('authenticated', 'public.email_notification_outbox', 'SELECT'),
    'Browser-authenticated users must not be able to read the private email outbox';
END;
$$;
