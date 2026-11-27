# Backend foundation

This directory contains the API contract, PostgreSQL schema and runtime-independent HTTP API handlers for Lumie's account-scoped data.

## API runtime

\`src/api.mjs\` exports \`createApiHandler({ pool, logger })\`, a Node.js handler for API Gateway HTTP API v2 events. The PostgreSQL pool is injected by the deployment entry point, which keeps the domain handler independently testable and avoids embedding database credentials in application code.

Supported operations:

- \`GET /v1/me\`: idempotently provision and return the authenticated profile.
- \`GET /v1/creations\`: list draft or archived creations with cursor pagination.
- \`POST /v1/creations\`: create a creation and its first immutable revision in one transaction.
- \`GET /v1/creations/{id}\`: retrieve an owned draft.
- \`PATCH /v1/creations/{id}\`: update with optimistic revision checking and append a new immutable revision.
- \`DELETE /v1/creations/{id}\`: archive a draft; no hard-delete route is exposed.
- \`GET /v1/creations/{id}/revisions\`: retrieve immutable revision history.

The handler expects API Gateway's verified JWT authorizer context at \`requestContext.authorizer.jwt.claims\`. It requires a Cognito access token claim (\`token_use=access\`) and a subject and issuer. It does not decode JWTs or accept identity values from request bodies. Configure the API Gateway JWT authorizer with the exact Cognito issuer and app-client audience/client ID before routing requests to this handler.

## Database transaction and row-level security

Every operation obtains a database client and performs all work inside one transaction:

1. Set transaction-local \`app.cognito_sub\` from the verified Cognito subject.
2. Insert the profile if absent, safely handling concurrent first requests.
3. Resolve exactly one profile under the profile bootstrap RLS policy.
4. Set transaction-local \`app.user_id\` to the internal profile UUID.
5. Execute account-scoped SQL under forced RLS.
6. Commit; on any failure, roll back and release the client.

Use a dedicated application database role that is not the table owner and does not have \`BYPASSRLS\`. Grant only the SQL privileges required by these handlers. Never use a superuser or migration owner as the runtime database identity.

## Deployment composition

The deployment entry point must create a bounded PostgreSQL connection pool, load its connection secret from AWS Secrets Manager, enable TLS with certificate verification, and inject the pool into \`createApiHandler\`. Do not commit database credentials, secret values, Cognito IDs or AWS access keys. Run the Lambda in a VPC with access to the database (or RDS Proxy), restrict outbound access, and configure API Gateway's JWT authorizer separately from the handler.

Recommended initial limits: Lambda timeout 10 seconds, memory 512 MB, database pool maximum 5 connections per execution environment, API Gateway request body limit enforced at the edge and in the handler. Set pool size against the database's total connection budget and expected Lambda concurrency before production traffic.

The API handler returns generic 500 responses and logs server-side errors. Production logging must redact request bodies, cookies, JWTs, email addresses and private document content. Add CloudWatch metrics and alarms for API errors, throttling, Lambda duration and database connection saturation.

## Identity and profile provisioning

Amazon Cognito is the identity provider. API Gateway validates the JWT signature, issuer, app-client audience/client ID and expiry. Lambda consumes only the trusted authorizer claims; it must not treat decoded, unverified browser claims as identity.

The first authenticated request to \`GET /v1/me\` provisions the profile if necessary. This is done in one transaction with parameterised queries. The unique Cognito subject and \`ON CONFLICT DO NOTHING\` make concurrent first requests idempotent.

Never accept \`cognitoSub\`, \`ownerId\` or an internal profile UUID as authority from a request body, query string or browser storage. Do not return the Cognito subject, raw JWT, email claims or authorizer context from \`GET /v1/me\`.

## Document storage

The editor's versioned JSON document remains canonical. Revisions are immutable snapshots. The current browser editor can embed image data in its local document; before cloud persistence is enabled in the client, media must be uploaded to private object storage and document elements must reference authorised asset IDs. Do not upload base64 data URLs inside document JSON.

## Tests

The API handler tests use a fake PostgreSQL client and exercise authorisation, profile bootstrap, atomic creation/revision writes, malformed documents, revision conflicts and transaction rollback. The existing CI database job independently applies the migration and exercises row-level security against PostgreSQL 16.

## Not yet deployed

This pass supplies executable request handlers and tests, not a live AWS environment. No Cognito pool, API Gateway, Lambda, database, RDS Proxy, Secrets Manager secret or S3 bucket has been provisioned. The frontend is not yet switched to these endpoints. Provisioning and wiring those services is a separate deployment step requiring an approved AWS account, region, credentials and cost controls.
