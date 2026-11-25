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
- [x] Add About and How it Works pages.
- [x] Add Privacy, Terms and Acceptable Use policies.
- [x] Add Cookie notice and Accessibility statement.
- [x] Add Contact page and complete public footer navigation.
- [ ] Confirm legal operator details, support contact and jurisdiction; obtain legal review before public launch.

## Public information and policy pages

The public site now includes About, How it Works, Contact, Privacy, Terms, Acceptable Use, Cookies and Accessibility routes. Policy copy reflects the current browser-local editor and explicitly distinguishes planned capabilities. These documents are working product drafts. The legal operator name, address, privacy/support contact, governing law, actual hosting providers and deployment data flows must be confirmed and reviewed before public launch.

## Milestone 2 — Creation editor
- [x] Integrate a rich-text engine and define a versioned document schema.
- [x] Add a full rich-text engine with headings, links and lists.
- [x] Add basic text emphasis and paragraph alignment controls.
- [x] Add canvas formats and paper background controls.
- [x] Add local image uploads and draggable media placement.
- [x] Add draggable text, stamp and decoration layers.
- [x] Add browser-local draft autosave and restore.
- [x] Add browser print layout.
- [x] Add high-resolution PNG export (3× pixel ratio) and format-sized print/PDF output.
- [x] Add keyboard selection and arrow-key layer positioning, including larger Shift+arrow movements.
- [x] Add accessible names, pressed states, visible focus treatment and keyboard-operable photo upload.
- [ ] Add automated editor accessibility and keyboard tests.

### Creation editor — first implementation and refinement

The editor now uses Tiptap and stores a JSON document per text layer. It supports mixed inline bold, italic, strikethrough, inline code and links; level-two and level-three headings; bulleted and numbered lists; block quotes; and paragraph alignment. The canvas renders the structured content, and the document carries schema version 2. Existing v1 browser drafts are migrated in memory, including their text, emphasis and alignment, then written back through the existing autosave key. Rich-text editor and document migration tests are still outstanding.

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


### Creation editor — export and document output

The Creation Studio provides a high-resolution PNG download and a print/PDF workflow. PNG export waits for web fonts and uploaded images, captures the composition at 3× pixel density, and excludes editor selection outlines. PDF output uses the browser's native print engine so text remains selectable and links remain links where supported. The print sheet is sized to the selected format: US Letter (8.5 × 11 in), postcard (6 × 4 in), square photo card (5 × 5 in), square collage (8 × 8 in), or memory page (8 × 10 in). Choose “Save as PDF” in the browser print dialog to create the PDF. Printer driver margins, colour handling and font availability remain controlled by the browser and printer.
