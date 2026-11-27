# Backend foundation

This directory defines Lumie's cloud API and PostgreSQL persistence contract. It is not deployed infrastructure.

## Scope

- OpenAPI 3.1 contract for account-scoped profiles, creations, immutable revisions and upload intents.
- PostgreSQL migration for profiles, creations, revisions and media assets.
- Forced row-level security (RLS) policies for every user-owned table.
- Cognito identity-to-profile provisioning contract and transaction-local database identity.

## Identity and profile provisioning

Amazon Cognito is the identity provider. API Gateway validates the JWT signature, issuer, app-client audience/client ID, token use and expiry. Lambda consumes only the trusted authorizer claims; it must not treat decoded, unverified browser claims as identity.

The first authenticated request to `GET /v1/me` provisions the profile if necessary. Perform the following sequence in one transaction with parameterised queries and a runtime role that does not own tables and does not have `BYPASSRLS`:

```sql
BEGIN;
SELECT set_config('app.cognito_sub', $1, true); -- verified JWT subject

INSERT INTO profiles (cognito_sub, display_name)
VALUES ($1, $2)
ON CONFLICT (cognito_sub) DO NOTHING;

SELECT id, display_name, avatar_asset_id, locale, time_zone, created_at
FROM profiles
WHERE cognito_sub = $1;
-- Require exactly one row.
SELECT set_config('app.user_id', $2, true); -- resolved internal profile UUID
COMMIT;
```

The unique Cognito subject and `ON CONFLICT DO NOTHING` make concurrent first requests idempotent. The existing RLS policy permits the verified subject to select its profile during bootstrap. After resolving the internal UUID, all user-owned data access uses `app.user_id` in the same transaction. Any failure rolls back the whole transaction.

Never accept `cognitoSub`, `ownerId` or an internal profile UUID as authority from a request body, query string or browser storage. Do not return the Cognito subject, raw JWT, email claims or authorizer context from `GET /v1/me`. The public profile contains only the internal profile ID, display name, avatar asset ID, locale, time zone and creation timestamp.

## Session boundary

The browser must not persist Cognito tokens in localStorage. The intended production session uses a backend-for-frontend exchange and Secure, HttpOnly, SameSite cookies, with CSRF protection on state-changing requests. Until that runtime exists, the frontend must not simulate an authenticated session or claim that account sign-in is available.

## Runtime boundary

The planned AWS runtime is Cognito JWT authorisation at API Gateway, Lambda handlers for domain operations, and PostgreSQL for relational state. Every handler must:

1. Consume verified Cognito authorizer claims.
2. Set `app.cognito_sub` transaction-locally from the verified JWT subject.
3. Resolve or create only that user's internal profile.
4. Set `app.user_id` transaction-locally to the resolved profile UUID.
5. Validate request bodies and enforce resource ownership.
6. Commit or roll back the transaction as one unit.

Never rely on frontend route guards for authorisation. Never accept `ownerId` as an authority from a request payload.

## Migrations and document storage

Apply migrations in lexical order using a migration runner in a controlled deployment pipeline. Do not apply them manually to production. The initial migration can be exercised against a disposable PostgreSQL database.

The editor's versioned JSON document remains the canonical source. Revisions are immutable snapshots. Sending will later create a correspondence record that references a specific revision so subsequent edits cannot rewrite an item already sent.

The current browser editor can embed image data in its local document. Before cloud persistence, uploads must be moved to private object storage and document elements must reference authorised asset IDs. Do not upload base64 data URLs inside document JSON.

## Deployment gate

No Cognito user pool, app client, hosted UI domain, API Gateway authorizer, Lambda runtime, database or cookie domain is provisioned by this pass. These require an approved AWS account, selected region and credentials. Configure callback/logout URLs for the production Lumie domain and local development separately; do not commit secrets.
