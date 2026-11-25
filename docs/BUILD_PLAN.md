# Build plan

This plan separates a visual prototype from a dependable correspondence product.

## Milestone 1 — Frontend foundation
- [x] Repository setup and project configuration.
- [x] Public homepage and responsive marketing navigation.
- [x] Application shell and navigation.
- [x] Dashboard, inbox, archive, collections and open-when sample views.
- [x] Product, architecture and build documentation.
- [x] Colourful contemporary mail-club visual direction.
- [x] About, How it Works, Contact and policy pages.
- [ ] Confirm legal operator details, support contact and jurisdiction; obtain legal review before public launch.

## Milestone 2 — Creation editor
- [x] Tiptap rich-text editor and versioned structured document schema.
- [x] Headings, links, lists, emphasis, inline code and paragraph alignment.
- [x] Five canvas formats and paper background controls.
- [x] Local image uploads and draggable composition layers.
- [x] Browser-local draft autosave and restore.
- [x] Undo/redo, duplicate, delete and keyboard movement.
- [x] High-resolution PNG export and format-sized browser print/PDF workflow.
- [x] Automated document, migration, link-safety and keyboard movement tests.
- [x] Add Playwright browser tests for Studio loading, keyboard movement, rich-text controls, PNG download and postcard print sizing.
- [x] Expand browser coverage for touch-pointer dragging, image uploads and all five print formats.
- [ ] Complete screen-reader testing with assistive technology and manual accessibility review.

### Creation editor — QA status

Vitest covers plain-text conversion, v1-to-v2 draft migration, document creation for all supported formats, rich-text link protocol filtering, keyboard movement increments and movement bounds. Playwright now exercises the live editor route, keyboard movement, rich-text controls, PNG download and postcard print sizing in Chromium. Automated coverage now includes touch-pointer movement, successful local image upload, the 3 MB rejection path and print dimensions for all five formats. Screen-reader testing with assistive technology and manual accessibility review remain outstanding.

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
- [ ] Add time-based unlock rules and server-side enforcement.
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

## Export notes

PNG export waits for web fonts and uploaded image decoding, captures at 3× pixel density and removes editor selection outlines. PDF output uses the browser's native print engine; choose Save as PDF in the print dialog. The print sheet is sized to US Letter (8.5 × 11 in), postcard (6 × 4 in), photo card (5 × 5 in), collage (8 × 8 in) or memory page (8 × 10 in). Browser, printer margins, font availability and colour handling affect final output.
