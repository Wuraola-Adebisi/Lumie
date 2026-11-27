# ADR-002: Identity and profile provisioning

- Status: Accepted
- Date: 2026-11-27

## Decision

Amazon Cognito is the identity provider. Lumie stores an internal profile UUID and the Cognito `sub` as a unique external identity key. The Cognito subject is the only identity value used to resolve account ownership.

The API authorizer validates JWT signature, issuer, app-client audience/client ID, token use and expiry before a Lambda handler receives claims. Application code consumes the trusted authorizer context; it must not decode a browser-supplied JWT and treat the result as verified.

## First authenticated request

The first authenticated request to `GET /v1/me` provisions the profile if it does not exist. The handler runs the following sequence in one database transaction, using a parameterised query and a runtime role subject to forced RLS:

```sql
BEGIN;
SELECT set_config('app.cognito_sub', $1, true); -- verified JWT sub

INSERT INTO profiles (cognito_sub, display_name)
VALUES ($1, $2)
ON CONFLICT (cognito_sub) DO NOTHING;

SELECT id, display_name, avatar_asset_id, locale, time_zone, created_at
FROM profiles
WHERE cognito_sub = $1;
-- Require exactly one row.
SELECT set_config('app.user_id', $2, true); -- selected internal profile UUID
COMMIT;
```

The insert is idempotent under concurrent first requests. The existing RLS policy permits the verified subject to select its own profile during bootstrap. After resolving the internal UUID, all user-owned data access uses `app.user_id` in the same transaction. If any step fails, the transaction rolls back.

## Trust and privacy boundaries

- Never accept `cognitoSub`, `ownerId` or an internal profile UUID as authority from a request body, query string or browser storage.
- Do not return the Cognito subject, raw JWT, email claims or authorizer context from `GET /v1/me`.
- Display name is user-editable profile data, not an authentication factor.
- The public profile response contains only the internal profile ID, display name, avatar asset ID, locale, time zone and creation timestamp.
- Access and ID tokens are accepted only where the API contract explicitly requires them. Refresh tokens are never accepted as API bearer credentials.
- A frontend route guard is a navigation convenience only. API authorisation and database RLS remain authoritative.

## Session strategy

The browser must not persist Cognito tokens in localStorage. The production session should use a backend-for-frontend exchange and Secure, HttpOnly, SameSite cookies, with CSRF protection on state-changing requests. Until that runtime exists, the frontend must not simulate an authenticated session or claim that account sign-in is available.

## Deployment gate

No Cognito user pool, app client, hosted UI domain, API Gateway authorizer, Lambda runtime, database or cookie domain is provisioned by this decision. These are deployment tasks requiring an approved AWS account, selected region and credentials. Configure callback/logout URLs for the production Lumie domain and local development separately; do not commit secrets.
