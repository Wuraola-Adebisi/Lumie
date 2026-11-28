# Lumie email delivery

Lumie writes notification events to the private `email_notification_outbox` table. Correspondence notifications are enqueued by a database trigger in the same transaction as the message, so a successful send/reply cannot silently skip its notification event. Scheduled letters are queued for their `available_at` time. Invitation emails are queued when the invitation is created; the invitation token itself is never stored in the database, only the one-time URL is placed in the private outbox payload.

The `lumie-email-worker` Supabase Edge Function claims work using `FOR UPDATE SKIP LOCKED`, sends a generic JSON request to the configured delivery endpoint, and records success or exponential retry state. It accepts requests only when the Authorization bearer token exactly matches the Supabase service-role key.

Configure these Edge Function secrets before enabling a scheduler:

- `EMAIL_DELIVERY_URL`: HTTPS endpoint accepting a JSON POST with `from`, `to`, `subject`, `text`, and `html`.
- `EMAIL_DELIVERY_API_KEY`: bearer credential for that endpoint.
- `EMAIL_FROM`: verified sender address, preferably on `lumiepost.com`.
- `APP_URL`: optional; defaults to `https://www.lumiepost.com`.

The delivery endpoint must return a 2xx response and may return an `id` or `message_id` field. Do not expose these secrets to the browser or put them in Vite environment variables. A scheduled caller should POST to the function with the service-role key in the Authorization header; keep that key in a server-side secret store only.

The app exposes a per-account preference for incoming correspondence email. Disabling it affects future notifications only; it does not delete correspondence or suppress invitation emails sent to non-members.
