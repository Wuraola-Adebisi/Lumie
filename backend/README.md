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


## Local development runtime

The repository includes a Docker Compose environment for exercising the API without AWS credentials or provisioned cloud resources.

### Services

- PostgreSQL 16: runs the same initial schema migration used by CI. A separate `lumie_app` role is created for API requests; it is not a superuser, table owner or RLS-bypass role.
- Keycloak: local OIDC identity provider with an imported `lumie` realm and a public PKCE client. The local API verifies RS256 signatures against the realm JWKS, checks issuer, authorised client and the access-token claim, then adapts only verified identity claims to the existing API Gateway handler.
- MinIO: S3-compatible private object-storage service with a local `lumie-private` bucket.
- Mailpit: local SMTP capture and inbox UI for later notification work.
- API: Node.js HTTP adapter on port 3001. It exposes `GET /health` and forwards authenticated API requests to the same `createApiHandler` used by the cloud deployment.

### Start

Requirements: Docker Desktop (or Docker Engine with the Compose plugin), Node.js 22 and npm.

```bash
docker compose up --build -d
```

Useful local endpoints:

| Service | Address |
| --- | --- |
| Web app (run separately) | http://localhost:5173 |
| API health | http://localhost:3001/health |
| Keycloak | http://localhost:8080 |
| MinIO console | http://localhost:9002 |
| Mailpit inbox | http://localhost:8025 |

The imported Keycloak development account is `wuraola.local` with password `lumie-local-only`. It is a disposable local-only account. The Keycloak admin console uses `admin` / `admin`. These credentials must never be reused outside this isolated development stack.

To run the API directly on the host instead of in Compose, install dependencies, copy `backend/local/.env.example` to `.env`, adjust the database host and JWKS URL to `localhost`, then run `npm run backend:dev`. The Compose API already has the correct service-to-service JWKS URL.

### Stop and reset

```bash
docker compose down
```

To erase all local database and object-storage data and start from a clean state:

```bash
docker compose down -v
docker compose up --build -d
```

The volume-removal command is destructive to local development data.

### Local API authentication

The local adapter does not accept decoded claims from the browser. It verifies the bearer token signature using Keycloak's published JWKS, pins the expected issuer and RS256 algorithm, and checks the authorised client and `token_use=access` claim. Only then does it construct the trusted authorizer context consumed by `createApiHandler`. The API still uses the separate PostgreSQL application role and forced row-level security.

### Boundaries

This is a development environment, not a production deployment. The bundled credentials, Keycloak dev mode, local HTTP endpoints and local storage must not be exposed to the public internet. The MinIO bucket is local infrastructure; asset upload/download API routes and frontend media integration are subsequent work. Mailpit captures mail locally; it does not deliver real email. No AWS account, AWS resource, NVIDIA service or live AI model is required or configured by this pass.


## Private media pipeline

`POST /v1/assets/upload-intents` creates an account-owned pending asset and returns a five-minute presigned PUT URL for JPEG, PNG, WebP or AVIF images up to 10 MiB. The server creates the object key. Upload bytes directly to the returned URL with its required Content-Type header. `POST /v1/assets/{assetId}/complete` verifies actual object size and MIME type before marking the asset ready; mismatches are deleted and rejected. `GET /v1/assets/{assetId}/download-url` returns a five-minute GET URL only for a ready asset owned by the caller. All metadata operations use the authenticated account's RLS context. Signed URLs are bearer capabilities and must not be logged or persisted. The bucket remains private.

The local API uses `STORAGE_ENDPOINT=http://minio:9000` for server-side checks and `STORAGE_PUBLIC_ENDPOINT=http://localhost:9001` for browser-facing URLs. Local credentials are development-only. No hosted AWS bucket or credentials are provisioned by this pass. Hosted deployment requires a private S3 bucket, least-privilege access, encryption, restricted CORS and cleanup of abandoned pending uploads. The editor still needs UI upload integration and document asset-ID replacement before photos persist cross-device.


### Studio photo persistence

The studio uploads selected JPEG, PNG, WebP and AVIF files (up to 10 MiB) using the authenticated asset intent API. The browser sends file bytes directly to the private object store, then asks the API to verify the stored object's content type and exact size. Creation documents retain only the stable `imageAssetId`; they never retain signed object URLs. When a creation is opened, the client requests a fresh short-lived download URL for each photo layer. Local browser drafts keep their own original image data so they can be recovered or imported later. Importing local creations uploads their photo layers before creating the cloud document.
