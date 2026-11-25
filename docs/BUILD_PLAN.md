# Build plan

This plan separates a visual prototype from a dependable correspondence product.

## Milestone 1 — Frontend foundation
- [x] Repository setup and project configuration.
- [x] Public homepage and responsive marketing navigation.
- [x] Application shell and navigation.
- [x] Dashboard, inbox, archive, collections and open-when sample views.
- [x] First-pass creation canvas with local state.
- [x] Detailed README and product/architecture documentation.
- [ ] Review visual direction and interaction details.
- [ ] Add How it Works, Features, Privacy and Terms pages.

## Milestone 2 — Creation editor
- [ ] Integrate Tiptap and define a versioned document schema.
- [ ] Add text formatting, headings, links and lists.
- [ ] Add canvas themes and background controls.
- [ ] Add image uploads and media placement.
- [ ] Add decorations and layout blocks.
- [ ] Add draft autosave and restore.
- [ ] Add export to PDF and PNG.
- [ ] Add editor accessibility and keyboard tests.

## Milestone 3 — Accounts and persistence
- [ ] Create Supabase project and local environment setup.
- [ ] Add migrations for profiles and creations.
- [ ] Add RLS policies and policy tests.
- [ ] Implement sign-up, sign-in, verification and recovery.
- [ ] Add protected application routes.
- [ ] Persist creations and private archive queries.
- [ ] Add profile and account settings.

## Milestone 4 — Correspondence
- [ ] Add threads, participants, messages and recipients.
- [ ] Add send-to-existing-user flow.
- [ ] Add guest invitation flow with expiring, revocable tokens.
- [ ] Add inbox and sent views backed by database queries.
- [ ] Add reply composition and thread permissions.
- [ ] Add transactional notifications and delivery status.
- [ ] Add abuse prevention and rate limiting.

## Milestone 5 — Collections and open-when
- [ ] Add personal collections.
- [ ] Add shared collection membership and role-based permissions.
- [ ] Add contribution submission and owner moderation.
- [ ] Add time-based unlock rules.
- [ ] Add server-side scheduling and access enforcement.
- [ ] Add recipient notifications for unlocked content.

## Milestone 6 — Production readiness
- [ ] Finalise privacy policy and terms against implemented behaviour.
- [ ] Add data export and account deletion.
- [ ] Add error monitoring and privacy-safe analytics.
- [ ] Add unit, integration and end-to-end tests.
- [ ] Run accessibility and performance audits.
- [ ] Configure production domain, email DNS and deployment secrets.
- [ ] Complete security review and a closed beta.

## Definition of done

A feature is not complete because its screen exists. It is complete when its data model, permissions, loading/error/empty states, accessibility, tests and user-facing copy are implemented and reviewed. Any functionality that remains sample-only must be labelled as such.
