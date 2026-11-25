# Lumie

**A little place for everything you want to say.**

Lumie is a creative correspondence platform for making, sending, receiving and preserving meaningful things. It is designed for everyone: friends, partners, families, communities and people writing to themselves.

The repository currently contains a responsive public site, application shell and browser-local Creation Studio. The editor supports structured rich text, five composition formats, draggable layers, local image uploads, draft autosave, undo/redo, high-resolution PNG export and browser print-to-PDF. Accounts, cloud persistence, actual message delivery, scheduled unlocking and shared collections are not connected.

## Product principles

- **Gender-inclusive by default.** Do not assume the sender, recipient or relationship is feminine, romantic or heterosexual.
- **Creative freedom.** Support short notes, long-form writing, visual compositions, collages and memory collections.
- **Private by default.** Personal writing is private unless deliberately shared.
- **Correspondence, not chat.** Encourage intentional messages rather than real-time chat pressure.
- **Meaningful ownership.** Users should be able to preserve, export and eventually delete their content.
- **Accessible expression.** Prioritise keyboard access, readable contrast and reduced-motion preferences.

## Current implementation

### Public website

The public site includes About, How it Works, Contact, Privacy, Terms, Acceptable Use, Cookies and Accessibility pages. Legal pages are working product drafts and require operator details and jurisdiction-appropriate review before public launch.

### Application shell

Responsive app navigation and dashboard are implemented. Inbox, archive, collections and open-when views still use sample data; they are not connected to accounts or correspondence delivery.

### Creation Studio

Open the editor at /app/create.

- Five formats: letter, postcard, photo card, collage and memory page.
- Tiptap rich text: headings, links, lists, bold, italic, strikethrough, inline code and paragraph alignment.
- Text, stamp, decoration and photo composition layers.
- Typeface, size, ink colour, paper colour, rotation and width controls.
- Pointer dragging and keyboard layer movement; Shift + arrow moves in larger increments.
- Undo/redo, duplicate, delete and browser-local autosave/restore.
- Local image uploads, limited to 3 MB per image.
- 3× PNG export after waiting for web fonts and image decoding.
- Format-sized browser print workflow. Choose Save as PDF in the print dialog. Text and links remain selectable/clickable where supported.

Drafts and uploaded image data are stored in this browser's local storage. They do not sync across devices or accounts. Browser print output depends on the browser's print engine, printer settings, font availability and colour handling. PNG output is raster.

### Not connected yet

- Authentication, account recovery and protected routes.
- Database persistence and cross-device sync.
- Actual sending, receiving and reply delivery.
- Guest invitations and collection permissions.
- Remote media storage.
- Server-enforced scheduled delivery and time locks.
- Email notifications.
- Billing or physical mail fulfilment.

## Technology

| Layer | Current implementation |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router |
| Styling | Tailwind CSS 3 + CSS variables |
| Icons | Lucide React |
| Rich text | Tiptap 2 |
| Composition export | html-to-image; browser-native print |
| Tests | Vitest |
| Future backend | Supabase Auth, PostgreSQL, Storage and server functions |
| Future email | Resend for transactional notifications |
| Deployment target | Vercel |

## Getting started

Requirements: Node.js 20.19+ or 22.12+ and npm 10+.

Clone the repository, run npm install, then npm run dev. Vite prints the local development URL, usually http://localhost:5173.

Available scripts: npm run dev (development server), npm run build (type-check and production build), npm run preview (production preview), npm run lint (ESLint), npm run test (Vitest), and npm run test:e2e (Playwright browser tests).

## Quality checks

GitHub Actions runs lint, tests and a production build on pushes and pull requests targeting main. Studio unit tests cover document creation, plain-text conversion, v1 draft migration, rich-text link protocol filtering, keyboard movement and movement bounds.

Playwright browser tests run in Chromium and cover Studio loading, keyboard movement, rich-text controls, PNG download, touch-pointer movement, local image upload and its 3 MB size limit, plus print dimensions for all five formats. Screen-reader testing with assistive technology and manual accessibility review remain outstanding.

## Proposed backend architecture

Supabase is the proposed next step: Auth for accounts; PostgreSQL for profiles, creations, recipients, threads, messages, collections and delivery schedules; RLS for ownership and participant permissions; private Storage for media; and Edge Functions or scheduled jobs for delivery, invitation acceptance, scheduled unlocking and notification dispatch. Resend is proposed for transactional email. Correspondence itself remains inside Lumie.

Keep editor documents as structured JSON, not flattened images. Generate exports from that source. Enforce sharing, guest invitation and time-lock permissions server-side.

## Security and privacy requirements

Before real users' writing is stored, enable RLS on every user-content table; deny access by default; keep storage private; validate guest tokens and expiry server-side; keep private content out of public metadata, analytics and logs; provide account export and deletion; document retention and processors; and decide whether end-to-end encryption is a product requirement before finalising the data model.

## Delivery roadmap

1. **Foundation and Creation Studio:** implemented, with browser-level QA still outstanding.
2. **Accounts and persistence:** Supabase project, schema, RLS, authentication, private media and cloud-backed drafts.
3. **Correspondence:** recipients, threads, replies, invitations, inbox/sent queries and notifications.
4. **Collections and Open When:** shared collections, contributor roles, moderation and server-enforced scheduled access.
5. **Production readiness:** legal review, data export/deletion, monitoring, automated tests, accessibility/performance audits, deployment and security review.

## Environment variables

No secrets are required for the current frontend. When Supabase is introduced, public client configuration will use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Never put a service-role key, Resend API key or other server secret in frontend environment variables.

## Status

**Current status: frontend foundation, Creation Studio and public information/policy pages.** Lumie is not yet a production correspondence service. The editor supports local composition and export, but drafts remain in the current browser. Backend functionality and browser-level QA remain future work.
