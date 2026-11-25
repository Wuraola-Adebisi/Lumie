# Build plan

This plan separates a visual prototype from a dependable correspondence product.

## Milestone 1 — Frontend foundation
- [x] Repository setup and project configuration.
- [x] Public homepage and responsive marketing navigation.
- [x] Application shell and navigation.
- [x] Dashboard, inbox, archive, collections and open-when sample views.
- [x] First-pass creation canvas with local state.
- [x] Detailed README and product/architecture documentation.
- [x] Review and establish the colourful contemporary mail-club visual direction.
- [ ] Add How it Works, Features, Privacy and Terms pages.

## Milestone 2 — Creation editor
- [ ] Integrate a rich-text engine and define a versioned document schema.
- [ ] Add text formatting, headings, links and lists.
- [x] Add canvas formats and paper background controls.
- [x] Add local image uploads and draggable media placement.
- [x] Add draggable text, stamp and decoration layers.
- [x] Add browser-local draft autosave and restore.
- [x] Add browser print layout.
- [ ] Add direct PNG and PDF export.
- [ ] Add editor accessibility and keyboard tests.

### Creation editor — first implementation

The first Creation Studio implementation is available at `/app/create`. It supports five starting formats, draggable composition layers, editable text, font selection, ink colour, paper colours, stamps, decorations, local image uploads (3 MB limit), undo/redo, duplication, local draft persistence and a print stylesheet. Drafts are stored in the current browser only. There is no account sync, remote media storage, direct PNG export or connected sending yet.

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
