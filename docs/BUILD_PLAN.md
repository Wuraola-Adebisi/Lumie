# Build plan

This plan distinguishes the working frontend MVP, the pre-programme AI preview and the connected correspondence product.

## Milestone 1 — Frontend foundation
- [x] Responsive public site and app shell.
- [x] Dashboard and sample inbox, archive, collections and open-when views.
- [x] About, How it Works, Contact and policy pages.
- [ ] Confirm legal operator details, support contact and jurisdiction; obtain legal review before public launch.
- [ ] Complete screen-reader testing and manual accessibility review.

## Milestone 2 — Creation Studio
- [x] Five formats, structured rich text, image composition and draggable layers.
- [x] Undo/redo, duplicate, delete and keyboard movement.
- [x] Browser-local draft persistence and restore.
- [x] Multiple named creations with independent editing sessions.
- [x] Search, reopen and delete saved creations from the archive.
- [x] Show the three most recently edited creations on the dashboard.
- [x] High-resolution PNG, print/PDF and share-image export.
- [x] Unit and Chromium Playwright coverage for core editor journeys.

## Milestone 3 — AI-ready MVP experience
- [x] Define user-led assistant principles and provider-neutral task contracts.
- [x] Add a clearly labelled local assistant preview with fixed sample responses.
- [x] Make assistant use optional; keep authoring and design controls fully manual.
- [ ] Add assistant feedback controls.
- [ ] Add mock-adapter tests and schema validation for task responses.
- [ ] Prepare programme-facing product and technical brief.
- [ ] Do not connect external model APIs before programme and infrastructure decisions.

## Milestone 4 — AWS backend foundation
- [ ] Select AWS region and validate service availability and credit eligibility.
- [ ] Add infrastructure as code (AWS CDK or Terraform; choose one).
- [ ] Configure Cognito, API Gateway, Lambda and PostgreSQL.
- [ ] Add private S3 buckets, KMS encryption and least-privilege IAM.
- [ ] Add migrations for profiles, documents, revisions and assets.
- [ ] Add authorisation tests and protected application routes.
- [ ] Implement cloud-backed creation persistence and cross-device access.
- [ ] Add monitoring, secrets management, quotas and backup/restore.

## Milestone 5 — Correspondence
- [ ] Add threads, participants, correspondence and recipient records.
- [ ] Add registered-user sending and recipient access.
- [ ] Add guest invitations with hashed, expiring and revocable tokens.
- [ ] Add inbox and sent views backed by database queries.
- [ ] Add replies and thread permissions.
- [ ] Add SES transactional notifications and delivery status.
- [ ] Add abuse prevention and rate limiting.

## Milestone 6 — Live AI foundation and first features
- [ ] Implement Lumie AI gateway and provider adapter interface.
- [ ] Connect Bedrock only after AWS access, budget and data policies are approved.
- [ ] Implement quotas, token/cost tracking, privacy-safe telemetry and failure handling.
- [ ] Add evaluation cases for voice preservation, intent, safety and structured output.
- [ ] Launch writing start/rewrite/tone assistance behind feature flags.
- [ ] Add structured design-direction output mapped to editable studio elements.
- [ ] Evaluate NVIDIA NIM for selected workloads; do not provision GPU infrastructure without a measured case.

## Milestone 7 — Personal memory and shared experiences
- [ ] Define granular AI consent and source selection.
- [ ] Add user-scoped embeddings and source-linked retrieval.
- [ ] Add memory inspection, deletion and re-indexing.
- [ ] Add collections, invitations, contribution roles and moderation.
- [ ] Add collection organisation assistance using selected contributions.
- [ ] Add Open When scheduling with server-side enforcement.

## Milestone 8 — Production readiness
- [ ] Finalise privacy policy and terms against actual processors and behaviour.
- [ ] Add account export, deletion, retention and backup procedures.
- [ ] Complete security, privacy, accessibility and performance audits.
- [ ] Add operational alerts, incident response and cost budgets.
- [ ] Run a closed beta and measure product usefulness, not just time in app.

## Definition of done

A feature is not complete because its screen exists. It is complete when its data model, permissions, loading/error/empty states, accessibility, tests and user-facing copy are implemented and reviewed. Mock functionality must be clearly identified and must not imply that a live external service is connected.
