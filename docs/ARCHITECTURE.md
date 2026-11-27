# Technical architecture

## Architecture principles

1. AWS-first cloud foundation for identity, data, storage, backend execution, scheduling, email and monitoring.
2. Provider-independent AI layer. The product calls Lumie-owned AI contracts; the backend routes tasks to Amazon Bedrock initially and can add NVIDIA NIM later.
3. User-controlled AI. Suggestions are proposals. Users approve every edit and external action.
4. Private by default. Access is enforced server-side.
5. Structured source documents. Preserve versioned editor JSON and generate exports from source documents.
6. Modular monolith first. Keep domain boundaries clear without premature microservices.

## Current implementation

React + TypeScript + Vite frontend with public site, app shell, Creation Studio, browser-local draft storage and export. Sample views are not connected to accounts or correspondence backend. The assistant preview uses fixed local examples; it does not call an AI provider or transmit prompts.

## Recommended AWS platform

| Concern | Service | Responsibility |
|---|---|---|
| Frontend delivery | Vercel initially; CloudFront/Amplify optional later | Web hosting |
| Identity | Amazon Cognito | Registration, verification, sessions, recovery |
| API entry | API Gateway | Authenticated application API |
| Backend compute | AWS Lambda | Domain operations and AI orchestration |
| Relational data | Aurora PostgreSQL Serverless v2 or RDS PostgreSQL | Profiles, documents, recipients, threads, collections |
| Vector retrieval | pgvector on PostgreSQL initially | User-scoped semantic retrieval |
| File storage | Private Amazon S3 buckets | Images, attachments, exports |
| Foundation models | Amazon Bedrock | Managed model inference and embeddings |
| Background jobs | Amazon SQS | Durable asynchronous processing |
| Scheduling/events | EventBridge Scheduler and EventBridge | Scheduled delivery and unlock events |
| Email | Amazon SES | Verification, invitations and transactional notices |
| Monitoring | CloudWatch and X-Ray | Logs, metrics, traces and alarms |
| Secrets | Secrets Manager / Parameter Store | Server-side credentials |
| Security | IAM, KMS, WAF | Least privilege, encryption and perimeter controls |

Choose Aurora Serverless v2 only after validating regional availability, minimum capacity and cost. A small RDS PostgreSQL deployment may be simpler for an early MVP. Keep the schema portable PostgreSQL. Do not provision production resources until funding, programme status and operating costs are understood.

## NVIDIA integration strategy

NVIDIA is an optional specialised AI execution and development layer, not a second cloud control plane.

- NVIDIA NIM: inference microservices for selected models when self-hosted or partner-hosted inference offers a measurable advantage.
- NVIDIA NeMo: model customisation and fine-tuning after task-specific data and evaluation justify it.
- NeMo Retriever: embedding, retrieval and reranking experiments for authorised personal memory search.
- NeMo Guardrails: optional additional interaction controls, evaluated against the AWS guardrail strategy.
- NeMo Evaluator: evaluation of quality, consistency, safety and task performance.

Do not assume Inception membership guarantees GPU capacity, credits or hosted inference. Start with managed inference and add NIM only when usage, latency, privacy, model choice or unit economics justify it.

## Application layers

Frontend features should be separated into auth, creations, correspondence, collections, open-when, assistant and notifications. No AWS secret, model key, SES credential or privileged database credential may be bundled into the frontend.

API Gateway routes to Lambda handlers. Each handler validates Cognito identity, input schema and resource permissions before calling domain logic.

Suggested API surface:
- GET/POST /v1/creations
- GET/PATCH/DELETE /v1/creations/{creationId}
- POST /v1/creations/{creationId}/revisions
- POST /v1/assets/upload-intents
- GET/POST /v1/threads
- POST /v1/threads/{threadId}/messages
- POST /v1/invitations
- GET/POST /v1/collections
- POST /v1/collections/{collectionId}/contributions
- POST /v1/assistant/{task}

## AI orchestration

All model calls happen server-side through a Lumie AI gateway. The gateway authenticates the user, validates the task, checks content ownership and AI consent, applies quotas, selects a provider/model from server-side configuration, loads only authorised context, validates structured output, applies safety checks and records usage metadata without logging private content.

The frontend never calls Bedrock or NVIDIA directly.

## Relational data model

Use PostgreSQL migrations and UUID primary keys.

- profiles: Cognito subject, display name, avatar key, locale, time zone and preferences.
- documents: owner, title, format, versioned document JSON, status and timestamps.
- document_revisions: document, revision number, JSON snapshot, author and timestamp.
- assets: owner, S3 object key, MIME type, size, dimensions, checksum and processing state.
- threads: creator, subject, thread type and timestamps.
- thread_participants: thread, user or invited-recipient identity, role and membership timestamps.
- correspondence: thread, source document/revision, sender, sent timestamp and status.
- correspondence_recipients: correspondence, recipient identity and individual delivery/access/open state.
- invitations: token hash, recipient address, resource scope, role, expiry and accepted/revoked timestamps.
- collections: owner, title, description, visibility, contribution mode and timestamps.
- collection_members: collection, user, role and inviter.
- contributions: collection, author, document and moderation state.
- scheduled_actions: action type, resource, recipient, due time, time zone, status and idempotency key.
- notifications and notification_preferences: in-app events and channel preferences.
- ai_preferences: user-level AI settings and consent choices.
- ai_memory_sources: user, selected source resource, consent and indexing state.
- ai_memory_chunks: user, source reference, chunk metadata, embedding, source location and deletion state.
- ai_usage_events: user, task, provider, model, token counts, latency, status and estimated cost. Never store raw prompts or completions by default.

Documents and correspondence are separate. Sending creates a correspondence record referencing a specific document revision. Later edits must not silently change an already-sent item.

## Security and privacy

- Map Cognito identity to an internal profile and authorise every resource in trusted backend code.
- Use least-privilege IAM roles for each Lambda.
- Keep S3 buckets private; issue short-lived presigned URLs only after authorisation.
- Encrypt data at rest with KMS and in transit with TLS.
- Keep credentials in Secrets Manager or Parameter Store.
- Validate MIME type, size and image contents; scan uploads where appropriate.
- Use expiring, revocable, hashed invitation tokens.
- Apply rate limits to invitations, sending and AI endpoints.
- Enforce scheduled and open-when access in backend code.
- Exclude private content from AI retrieval unless the user opts in and selects eligible sources.
- Enforce user filters on every memory retrieval query; test cross-user isolation.
- Do not train shared models on private correspondence by default.
- Avoid raw content in logs and analytics.
- Define export, deletion, retention, backup and recovery before public launch.
- Decide whether end-to-end encryption is required before finalising search, AI retrieval and collaboration.

## AI privacy and consent

Consent is specific to task and source. A user can request help with text they actively provide without granting access to their whole archive. Memory indexing requires separate opt-in and source selection. Users can inspect and delete indexed memory. Retrieved items carry source references. Do not use another participant's private message as AI context without appropriate access and consent.

## Environments and delivery

- Local: frontend mocks and synthetic data; no provider credentials.
- Development: isolated AWS resources and synthetic test data.
- Staging: production-like configuration and test identities.
- Production: isolated environment, approved secrets, monitoring and budgets.

Use GitHub Actions for quality checks and deployment. Add infrastructure as code before provisioning shared or production resources; choose AWS CDK or Terraform, not both.

## Cost controls

Set quotas per task, user and environment. Route simple transformations to smaller models. Cap prompt and output sizes. Use queues for long-running jobs. Track cost per successful task and active user. Do not provision GPU-hosted inference until measured demand justifies it.

## Decisions before implementation

Confirm AWS region, database option, email provider, guest-recipient access, send revocation, post-send edits, read receipts, end-to-end encryption, AI consent granularity and legal/privacy requirements.
