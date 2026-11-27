# Backend foundation

This directory defines Lumie's first cloud API and PostgreSQL persistence contract. It is intentionally provider-neutral and is not deployed infrastructure.

## Scope

- OpenAPI 3.1 contract for account-scoped creations, immutable revisions and upload intents.
- PostgreSQL migration for profiles, creations, revisions and media assets.
- Row-level security (RLS) policies for every user-owned table.
- A transaction-local identity contract between authenticated API handlers and PostgreSQL.

## Runtime boundary

The planned AWS runtime is Cognito JWT authorisation at API Gateway, Lambda handlers for domain operations, and PostgreSQL for relational state. Lambda must resolve the verified Cognito `sub` to an internal `profiles.id`, then set `app.user_id` on the same database transaction before accessing user-owned rows:

```sql
BEGIN;
SELECT set_config('app.user_id', $1, true);
-- Execute parameterised queries in this transaction.
COMMIT;
```

The value passed to `set_config` must be the internal profile UUID obtained from the verified identity, never a client-supplied owner ID. Use a runtime database role that does not own tables and does not have `BYPASSRLS`. The migration owner and runtime role must be separate.

Every handler must:
1. Verify the Cognito JWT at the API boundary.
2. Resolve the immutable Cognito subject to an internal profile.
3. Start a transaction and set `app.user_id` transaction-locally.
4. Validate request bodies and enforce resource ownership.
5. Commit or roll back the transaction as one unit.

Never rely on frontend route guards for authorisation.

## Migrations

Apply migrations in lexical order using a migration runner in a controlled deployment pipeline. Do not apply them manually to production. The initial migration is additive and can be exercised against a disposable PostgreSQL database.

## Document storage

The editor's versioned JSON document remains the canonical source. Revisions are immutable snapshots. Sent correspondence will later reference a specific revision so subsequent edits cannot rewrite an item already sent.

The current browser editor can embed image data in its local document. Before cloud persistence, uploads must be moved to private object storage and document elements must reference authorised asset IDs. Do not upload base64 data URLs inside document JSON.

## Deliberately not included

No AWS resources are created, no Cognito pool is configured, no database is provisioned, no credentials are required, and no live API is exposed by this pass. Region, database deployment option and funding/credit availability remain deployment decisions.
