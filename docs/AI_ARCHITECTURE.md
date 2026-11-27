# Lumie AI architecture

## Product role

Lumie's assistant is an optional, user-directed creative companion for expression, writing, design and personal memory. It is not an autonomous sender, relationship adviser or replacement author. Suggestions are drafts or proposals that the user can edit, accept, reject or ignore.

## Pre-programme MVP boundary

The assistant preview uses fixed, authored examples in the browser. It does not call an external AI API, transmit prompt or document content, store AI conversation history, claim that a model generated its responses, or automatically change a document. The UI identifies this as a sample preview.

## Initial task catalogue

| Task | User intent | Output |
|---|---|---|
| writing.start | Help me begin | Opening approaches or prompts |
| writing.rewrite | Rewrite selected text | Alternative text preserving intent |
| writing.tone | Explore a tone | Revised draft plus tone description |
| writing.clarity | Make this clearer | Clearer draft without invented facts |
| writing.voice | Preserve my voice | Edited text with minimal stylistic drift |
| design.direction | Help me visualise this | Structured composition direction |
| memory.search | Find something I wrote | Source-linked authorised results |
| collection.organise | Shape a keepsake | Proposed structure using selected contributions |

The first live release should focus on writing.start, writing.rewrite, writing.tone and design.direction. Memory retrieval follows only after consent, isolation and deletion controls are implemented.

## Provider-neutral contracts

The frontend calls Lumie API endpoints, never provider SDKs. An assistant request contains a task identifier, user-provided input, optional selected text or document ID, format, explicitly selected source IDs and preferences such as tone, length and voice preservation.

An assistant response contains a request ID, task, provider/model identifiers, completion status, validated suggestions, optional rationale and source references, plus non-content usage metadata. Provider and model selection are server-owned.

## Orchestration lifecycle

1. Authenticate user.
2. Validate task and payload size.
3. Verify resource ownership and recipient permissions.
4. Check AI preferences, source-level consent and quota.
5. Build a task-specific prompt using permitted context only.
6. Route to configured provider adapter.
7. Validate output against a task-specific JSON schema.
8. Apply safety and product-specific checks.
9. Return suggestions with provenance.
10. Record provider, model, tokens, latency and outcome without retaining raw personal content by default.

## Model adapters

Define a shared generation interface and separate adapters:
- Bedrock adapter: initial managed inference path.
- NVIDIA NIM adapter: optional NIM endpoint for selected models/workloads.
- Mock adapter: deterministic fixtures for local development, tests and demo mode.

Mock mode must be explicit in configuration. Production must fail closed if a live provider is expected but not configured; it must not silently return sample content.

## Evaluation

Build versioned cases for intent preservation, tone control, voice retention, clarity without invented facts, sensitive prompts, structured design output validity, prompt-injection resistance, cross-user isolation, source fidelity, latency, token consumption and cost. Measure acceptance, edits, rejection and user feedback. Fluency alone is not evidence of usefulness.

## Privacy rules

No model training on private user content by default. No archive-wide retrieval without explicit opt-in and source selection. Do not place raw correspondence in logs or analytics. Allow deletion of indexed memory and embeddings. Do not use another participant's private message as context without appropriate access and consent. Explain which content is used when AI processing occurs.
