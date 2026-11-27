# Lumie

**Website:** https://www.lumiepost.com  
**Contact:** hello@lumiepost.com

**A creative correspondence studio with an assistant when you want one.**

Lumie is an AI-assisted creative correspondence platform for making, exchanging and preserving meaningful things. People write in their own words, shape expressive letters and visual messages, and can invite an assistant to help with ideas, phrasing and creative direction. It is designed for everyone: friends, partners, families, communities and people writing to themselves.

The repository contains a responsive public site, authenticated application shell and Creation Studio. Sign-in uses OpenID Connect authorization code flow with PKCE; account profiles and creations are persisted through the authenticated API and PostgreSQL. The editor supports structured rich text, five composition formats, draggable layers, image composition, autosave, undo/redo, high-resolution PNG export and browser print-to-PDF.

The assistant foundation remains provider-neutral. Production model inference and actual correspondence delivery are separate roadmap items.

## Product principles

- **Gender-inclusive by default.** Do not assume the sender, recipient or relationship is feminine, romantic or heterosexual.
- **Creative freedom.** Support short notes, long-form writing, visual compositions, collages and memory collections.
- **Private by default.** Personal writing is private unless deliberately shared.
- **Correspondence, not chat.** Encourage intentional messages rather than real-time chat pressure.
- **Meaningful ownership.** Users should be able to preserve, export and eventually delete their content.
- **Accessible expression.** Prioritise keyboard access, readable contrast and reduced-motion preferences.

## Current implementation

### Public website

The public site is served at https://www.lumiepost.com and includes About, How it Works, Contact, Privacy, Terms, Acceptable Use, Cookies and Accessibility pages. Public enquiries and privacy, accessibility or security concerns can be sent to hello@lumiepost.com. Legal pages are working product drafts and require operator details and jurisdiction-appropriate review before public launch.

### Application shell

Responsive app navigation, OIDC sign-in, profile provisioning, account-scoped creation persistence and archive listing are connected to the API. Inbox, collections and open-when views still need their live correspondence workflows.

### Creation Studio

Open the editor at /app/create.

- Five formats: letter, postcard, photo card, collage and memory page.
- Tiptap rich text: headings, links, lists, bold, italic, strikethrough, inline code and paragraph alignment.
- Text, stamp, decoration and photo composition layers.
- Typeface, size, ink colour, paper colour, rotation and width controls.
- Pointer dragging and keyboard layer movement; Shift + arrow moves in larger increments.
- Undo/redo, duplicate, delete and browser-local autosave/restore.
- Multiple named creations, saved independently on this device.
- Search, reopen and delete from the archive, with recent creations on the dashboard.
- Migration of the previous single-draft storage key into the library.
- Local image uploads, limited to 3 MB per image.
- 3× PNG export after waiting for web fonts and image decoding.
- Format-sized browser print workflow. Choose Save as PDF in the print dialog. Text and links remain selectable/clickable where supported.

Account-backed creation documents and immutable revisions are stored in PostgreSQL through the authenticated API. Existing local creations can be imported into an account. Creations containing embedded image data remain local until private media upload is connected. Browser print output depends on the browser's print engine, printer settings, font availability and colour handling. PNG output is raster.

### Not connected yet

- Live AI inference, model orchestration and personal memory retrieval.
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
| Styling | Tailwind CSS 3 for layout and type, plain CSS in src/styles for the 3D mail objects |
| Fonts | MuseoModerno (display), Figtree (body), Courier Prime (typewriter), Caveat (handwriting), DM Serif Display; self-hosted through Fontsource |
| Icons | Lucide React |
| Rich text | Tiptap 2 |
| Composition export | html-to-image; browser-native print |
| Tests | Vitest |
| Planned backend | Amazon Cognito, API Gateway, Lambda, PostgreSQL and S3 |
| Planned AI | Amazon Bedrock behind a provider-neutral Lumie AI gateway; NVIDIA NIM/NeMo optional later |
| Planned email | Amazon SES for transactional notifications |\n| Deployment target | Vercel initially; AWS delivery services may be evaluated later |

## Design

Lumie is styled as a mail club: perforated stamps, postmarks, envelopes, typewritten letters and postcards that turn over. The palette comes from the reference set (cobalt, tomato, saffron, moss, bubblegum, lilac, lime on cream graph paper).

- `src/components/mail` holds the physical pieces: Stamp, Postmark, HoloSeal, Sticker, Envelope, Postcard3D, LetterSheet and the illustrations in Art.
- The Creation Studio has a 3D view of the sheet and a Share image dialog. Share images place the piece on a gingham, cobalt, graph paper or tomato desk and export at 1080 x 1350, 1080 x 1920 or 1080 x 1080.
- Pointer tilt is disabled for touch input and for reduced-motion preferences.

## Getting started

Requirements: Node.js 20.19+ or 22.12+ and npm 10+.

Clone the repository and run npm install. Start the local services with `docker compose up --build -d`, copy `.env.local.example` to `.env.local`, then run `npm run dev`. Vite prints the local development URL, usually http://localhost:5173. The local Keycloak realm includes the disposable account `wuraola.local` / `lumie-local-only`. Do not expose the development stack or reuse these credentials outside localhost.

Available scripts: npm run dev (development server), npm run build (type-check and production build), npm run preview (production preview), npm run lint (ESLint), npm run test (Vitest), and npm run test:e2e (Playwright browser tests).

## Quality checks

GitHub Actions runs lint, tests and a production build on pushes and pull requests targeting main. Studio unit tests cover document creation, plain-text conversion, v1 draft migration, rich-text link protocol filtering, keyboard movement and movement bounds.

Playwright browser tests run in Chromium and cover Studio loading, keyboard movement, rich-text controls, PNG download, touch-pointer movement, local image upload and its 3 MB size limit, plus print dimensions for all five formats. Screen-reader testing with assistive technology and manual accessibility review remain outstanding.

## Proposed backend architecture

AWS is the planned backend foundation: Cognito for identity; API Gateway and Lambda for application APIs; PostgreSQL for profiles, creations, recipients, threads, messages, collections and delivery schedules; private S3 storage for media; and SQS/EventBridge for delivery, invitation acceptance, scheduled unlocking and notification dispatch. SES is planned for transactional email. Bedrock sits behind a provider-neutral Lumie AI gateway, with NVIDIA NIM/NeMo available for selected workloads if justified. Correspondence itself remains inside Lumie.

Keep editor documents as structured JSON, not flattened images. Generate exports from that source. Enforce sharing, guest invitation and time-lock permissions server-side.

## Security and privacy requirements

Before real users' writing is stored, enable RLS on every user-content table; deny access by default; keep storage private; validate guest tokens and expiry server-side; keep private content out of public metadata, analytics and logs; provide account export and deletion; document retention and processors; and decide whether end-to-end encryption is a product requirement before finalising the data model.

## Delivery roadmap

1. **Foundation and Creation Studio:** implemented, including the local creation library; screen-reader and manual accessibility QA remain outstanding.
2. **Accounts and persistence:** AWS infrastructure, Cognito, API, database, private media and cloud-backed creations.
3. **Correspondence:** recipients, threads, replies, invitations, inbox/sent queries and notifications.
4. **Collections and Open When:** shared collections, contributor roles, moderation and server-enforced scheduled access.
5. **Production readiness:** legal review, data export/deletion, monitoring, automated tests, accessibility/performance audits, deployment and security review.

## Environment variables

The frontend uses `.env.local` for `VITE_API_BASE_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI` and `VITE_OIDC_POST_LOGOUT_REDIRECT_URI`. The example file targets the local Docker services. Production builds must use the production identity issuer and API origin. AWS credentials, model access, SES credentials, database credentials and all privileged keys remain server-side. Never place them in VITE_ variables.

## Status

**Current status: Creation Studio, OIDC account sign-in, profile provisioning and cloud-backed creation persistence are implemented.** The local Docker stack supports end-to-end development without cloud credentials. Private media uploads, live correspondence delivery, collections, scheduled access and production AI inference remain on the delivery roadmap.
