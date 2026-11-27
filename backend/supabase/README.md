# Supabase production foundation

This directory contains the Supabase production schema migrations for Lumie. These migrations are separate from the legacy local PostgreSQL/Keycloak development stack.

## Migration order

1. `0003_supabase_auth_and_correspondence.sql` creates the account model against `auth.users`, cloud creations and immutable revision records, private asset metadata, correspondence threads/participants/messages, asset grants, indexes, timestamp triggers, profile provisioning, RLS policies and Data API grants.
2. `0004_private_media_storage.sql` creates the private `lumie-private` Storage bucket. Object keys use `<auth.uid()>/<asset UUID>`; only JPEG, PNG, WebP and AVIF files up to 10 MiB are accepted.
3. `0005_rls_bootstrap_and_asset_lifecycle.sql` closes the initial thread-creation visibility gap, consolidates thread read policy, and keeps asset status transitions, grants and object deletion server-controlled.

## Identity and access model

- `profiles.id` is the Supabase Auth user UUID and references `auth.users.id`.
- The profile trigger copies only a display name from user metadata. User-editable metadata is never used for authorization.
- Every exposed `public` table has RLS enabled. Account-owned records compare their owner/profile ID with `auth.uid()`.
- Correspondence is visible only to its creator or participants. Message snapshots and creation revisions have no client update/delete grants.
- Asset metadata is private. A user may create pending upload metadata for their own account; only a trusted server operation may mark an asset ready or create a thread grant.
- Storage is private. The browser cannot delete stored objects directly.

## Runtime boundary

The production frontend and API have not yet been switched to Supabase by this schema pass. The existing browser client still targets the Cognito/OIDC + API Gateway contract. Do not set production Supabase environment variables and assume that this completes the migration.

The next integration pass must replace the Cognito-specific API identity adapter with a Supabase JWT-aware server runtime (prefer Edge Functions or a trusted API that verifies Supabase JWTs), implement atomic correspondence dispatch and asset verification, and wire the browser's Supabase Auth client. Never put a service-role/secret key in a `VITE_` variable.

## Live project

The migrations in this directory were applied to the dedicated `Lumie` project in the `Wuraola's Compound` Supabase organization. Keep the SQL files in source control as the canonical schema history and verify them against a clean project before using them for any other environment.
