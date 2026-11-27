# ADR-001: Cloud persistence boundary for Lumie

- Status: Accepted for the first backend implementation
- Date: 2026-11-27

## Context

Lumie's current Creation Studio stores structured documents and image data in browser local storage. Cloud persistence must support account ownership, cross-device access, recoverable revisions and private media without coupling the editor to an AWS SDK or exposing privileged credentials.

The backend is planned around Cognito, API Gateway, Lambda, PostgreSQL and private S3. Live AWS resources are intentionally not provisioned in this phase.

## Decisions

1. **PostgreSQL is the relational source of truth.** Keep the schema portable PostgreSQL. Select RDS versus Aurora and the AWS region only after service availability, credit terms and minimum monthly cost are verified.
2. **Cognito identity is mapped to an internal profile UUID.** Store the immutable Cognito subject in `profiles.cognito_sub`; never accept an owner ID from the client.
3. **Every user-owned table uses forced row-level security.** API transactions set `app.user_id` from the verified profile identity. The runtime role must not own tables and must not have `BYPASSRLS`.
4. **A creation is a versioned structured document.** Store schema-versioned JSONB, not flattened screenshots. Append immutable revision snapshots and use optimistic concurrency through `expectedRevision`.
5. **Media is stored separately.** Private object storage holds uploaded images. Document JSON references asset IDs; binary data URLs are not accepted in cloud document payloads.
6. **Soft archive is the initial delete behaviour for creations.** Account deletion and permanent erasure will be a separate, explicit lifecycle workflow that covers database rows, objects, revisions, exports and backups.
7. **The API contract is provider-neutral.** The frontend communicates with Lumie-owned endpoints. AWS SDKs, database credentials and model credentials remain server-side.
8. **No end-to-end encryption guarantee is made by this architecture.** The first cloud design uses TLS in transit, KMS-backed encryption at rest and strict server-side access controls. Whether Lumie should offer end-to-end encrypted private writing is an unresolved product/security decision. It must be decided before public launch because it affects search, AI processing, recovery and collaboration.

## Consequences

- Frontend cloud adapters can be implemented against a stable OpenAPI contract before AWS resources are provisioned.
- Database queries must execute inside a transaction that sets the verified internal profile ID.
- RLS policies are defence in depth, not a replacement for handler-level permission checks.
- The initial schema deliberately excludes correspondence, guest invitations, collections and scheduled unlocks. Those domains need separate permission and lifecycle design.
- Upload completion must be verified server-side (object existence, size, actual MIME/content and checksum) before an asset is marked ready.
- Region, database product, account recovery policy, end-to-end encryption and data retention remain launch gates.
