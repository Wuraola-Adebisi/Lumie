# AWS and NVIDIA programme architecture brief

## Product description

Lumie is building an AI-assisted creative correspondence platform. It helps people create expressive letters, postcards and memory keepsakes while keeping authors in control of their words and design decisions. Planned AI capabilities include writing assistance, voice-aware editing, natural-language-to-editable-design suggestions and opt-in retrieval across a user's own selected correspondence.

The current MVP demonstrates the Creation Studio and a clearly labelled local assistant preview. No live foundation model is connected. The team is preparing a provider-neutral AI orchestration layer and an AWS-first cloud architecture before integrating a production model.

## AWS-first platform plan

- Amazon Cognito: user identity, verification and recovery.
- API Gateway and Lambda: authenticated application API and domain operations.
- Aurora PostgreSQL Serverless v2 or RDS PostgreSQL: relational data; pgvector for initial user-scoped semantic retrieval.
- Amazon S3: private user media, attachments, exports and previews.
- Amazon Bedrock: managed foundation model inference and embeddings.
- SQS and EventBridge Scheduler: asynchronous jobs and scheduled correspondence.
- Amazon SES: transactional email.
- CloudWatch, X-Ray, KMS, IAM, Secrets Manager and WAF: observability and security.

Final service selection and region will be validated against current availability, credit eligibility, data protection requirements and operating costs.

## NVIDIA plan

- NVIDIA Inception: ecosystem, technical enablement and partner opportunities.
- NVIDIA NIM: optional inference microservices for selected models when performance, model choice, privacy or unit economics justify it.
- NVIDIA NeMo: experimentation and task-specific model customisation after establishing consented evaluation data.
- NeMo Retriever: retrieval and reranking experiments for opt-in personal memory.
- NeMo Guardrails and Evaluator: additional safety and evaluation tooling where they add measurable value.

NVIDIA components are planned integrations, not dependencies for the initial MVP. Programme membership or GPU credits are not assumed.

## Applied AI work

The first applied AI work will focus on helping users start a personal letter, rewriting selected text while preserving intent and voice, exploring tone without stereotyping relationships, translating a natural-language design brief into editable composition instructions, and building opt-in, source-linked personal memory retrieval after privacy controls are ready.

We will evaluate usefulness, voice preservation, factual consistency, safety, latency and cost per successful task.

## Data governance

Private correspondence is not used for shared model training by default. AI processing is user-initiated and scoped to selected content. Memory indexing is separately opt-in. Users can inspect and delete indexed memory. Model calls occur server-side and are recorded with non-content usage metadata. Suggestions require user approval before they alter documents or trigger external actions.

## MVP versus planned integration

| Capability | Status |
|---|---|
| Creative editor and export | Implemented in frontend |
| Local draft persistence | Implemented in browser |
| Assistant interaction preview | Local sample responses only |
| User accounts and cloud persistence | Planned |
| Live Bedrock inference | Not connected |
| NVIDIA NIM inference | Not connected |
| Fine-tuned Lumie model | Research direction; not built |
| Personal memory retrieval | Planned; consent and security first |
| Correspondence sending and replies | Planned |
| Shared collections | Planned |

This brief describes the intended technical direction. Update it as services are provisioned, tested and adopted.
