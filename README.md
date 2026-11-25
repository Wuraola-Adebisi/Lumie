# Lumie

**A little place for everything you want to say.**

Lumie is a creative correspondence platform for making, sending, receiving and preserving meaningful things. It is designed for everyone: friends, partners, families, communities and people writing to themselves.

This repository contains the first product foundation: a responsive public site and an interactive frontend application shell. The current release is a frontend-first product foundation. The Creation Studio supports browser-local composition and draft persistence; account creation, message delivery, scheduled unlocking and cloud persistence are not operational.

## Product direction

Lumie is not a conventional chat app, a notes app or a rigid digital stationery template. It combines expressive creation with thoughtful correspondence.

The core loop:

1. **Create** something worth sharing: a letter, note, memory page or open-when message.
2. **Personalise** it with typography, colour, imagery and layout.
3. **Send** it to someone or keep it private.
4. **Receive** a response and continue the exchange.
5. **Preserve** the exchange in a personal archive or collection.

### Product principles

- **Gender-inclusive by default.** Brand and product language should not assume the sender, recipient or relationship is feminine, romantic or heterosexual.
- **Creative freedom.** A letter can be a few lines, a long-form note, a visual composition, a collage or a memory collection. Do not force every creation into a paper-letter metaphor.
- **Private by default.** Personal writing is private unless the author deliberately shares it.
- **Correspondence, not chat.** Exchanges are threaded, but the experience should encourage intentional messages rather than real-time chat pressure.
- **Meaningful ownership.** Users should be able to preserve, export and eventually delete their content.
- **Accessible expression.** Design choices must not compromise keyboard access, readable contrast or reduced-motion preferences.

## What's in this first pass

- Responsive marketing homepage with product positioning and clear calls to action.
- Public navigation and footer.
- App shell with sidebar navigation and mobile navigation.
- Dashboard with overview cards, recent writing, incoming correspondence and collections.
- Explore/create entry points for different kinds of writing.
- Inbox-style correspondence view with sample threads.
- Private archive view.
- Collections view with sample shared and personal collections.
- Open-when view.
- Responsive styling and a shared visual system.
- Sample data isolated from page components.

### Not connected yet

These are intentionally not represented as working backend features in this pass:

- Authentication and account recovery.
- Database persistence and cross-device sync.
- Actual sending, receiving and reply delivery.
- Guest invitation links and collection permissions.
- Remote media storage and media processing.
- Scheduled delivery and server-enforced time locks.
- Email notifications.
- Billing, subscriptions or physical mail fulfilment.

Dashboard, inbox, archive, collections and open-when screens still use sample data. Creation Studio drafts persist in the current browser's local storage; they do not sync across devices or accounts.

## Technology

| Layer | First-pass choice |
| --- | --- |
| UI | React 18 + TypeScript |
| Build | Vite |
| Routing | React Router |
| Styling | Tailwind CSS 3 + CSS variables |
| Icons | Lucide React |
| Creation editor | Custom structured composition layers (first implementation) |
| Future rich text | Tiptap (planned, not installed yet) |
| Future backend | Supabase Auth, PostgreSQL, Storage and server functions |
| Future email | Resend for transactional notifications |
| Deployment target | Vercel |

The frontend is structured so backend services can be introduced behind feature-level modules rather than embedded directly into page components.

## Getting started

### Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

### Install and run

```bash
git clone https://github.com/Wuraola-Adebisi/Lumie.git
cd Lumie
npm install
npm run dev
```

Vite prints the local development URL, usually `http://localhost:5173`.

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Repository structure

```text
lumie/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── app/
│   │   │   ├── AppShell.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── marketing/
│   │   │   ├── MarketingHeader.tsx
│   │   │   └── MarketingFooter.tsx
│   │   └── ui/
│   │       └── BrandMark.tsx
│   ├── data/
│   │   └── sampleData.ts
│   ├── features/
│   │   └── studio/
│   │       ├── StudioCanvas.tsx
│   │       ├── StudioInspector.tsx
│   │       └── studioTypes.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── InboxPage.tsx
│   │   ├── ArchivePage.tsx
│   │   ├── CollectionsPage.tsx
│   │   └── OpenWhenPage.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── studio.css
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Product information architecture

### Public website

- **Home:** positioning, product value, use cases and calls to action.
- **How it works:** create, personalise, share and preserve.
- **Features:** creative editor, correspondence, collections and open-when writing.
- **Privacy:** explain privacy principles and data handling accurately once implemented.
- **Terms:** service terms reviewed for the actual operating model before launch.

The first pass puts the homepage in place. Legal pages should not be published as final legal advice or as promises about backend controls that have not been implemented.

### Application

- **Home:** overview, recent activity and shortcuts.
- **Create:** start a private note, letter, memory page or open-when creation.
- **Inbox:** received correspondence and threaded exchanges.
- **Sent:** items deliberately sent to other people.
- **Archive:** private writing and preserved correspondence.
- **Collections:** personal and collaborative collections.
- **Open when:** messages intended to be opened at a later time or moment.
- **Settings:** profile, privacy, notifications and account controls (future phase).

## Proposed backend architecture

The current frontend is backend-agnostic. The recommended next step is Supabase:

- **Supabase Auth:** email authentication, OAuth if required, recovery and session management.
- **PostgreSQL:** users, profiles, creations, recipients, threads, messages, collections, contributions and delivery schedules.
- **Row Level Security:** enforce ownership and participant permissions in the database. Hiding UI controls is not access control.
- **Supabase Storage:** private media buckets with signed, permission-checked access.
- **Edge Functions / scheduled jobs:** delivery, invitation acceptance, scheduled unlocks and notification dispatch.
- **Resend:** transactional email for invitations and notifications. The actual correspondence remains inside Lumie.

### Suggested domain model

| Entity | Purpose |
| --- | --- |
| profiles | Public display identity and user preferences |
| creations | Authored content, type, structured document, visibility and status |
| recipients | Intended recipients and delivery state |
| correspondence_threads | A conversation around a sequence of designed messages |
| messages | Individual messages within a thread |
| collections | Personal or collaborative groups of creations |
| collection_members | Contributors and permission levels |
| collection_contributions | Items submitted by invited contributors |
| unlock_rules | Time or condition rules for open-when content |
| media_assets | Metadata and storage paths for uploaded assets |
| notifications | In-app notification state and delivery metadata |

Store the editor document as structured JSON, not only as a flattened image. Generate PNG/PDF exports from that source. Model thread participation and collection access explicitly.

### Security and privacy requirements

Before real users' writing is stored:

1. Enable RLS on every user-content table.
2. Deny access by default and grant only explicit owner/participant permissions.
3. Keep storage buckets private; validate ownership before issuing signed URLs.
4. Enforce scheduled locks on the server. A disabled button or hidden component is not a time lock.
5. Validate guest invitation tokens, expiry and permitted actions server-side.
6. Do not expose private content in public metadata, analytics events, logs or search indexing.
7. Provide account export and deletion workflows.
8. Document retention, backups, email delivery and third-party processors in the privacy policy.
9. Decide whether end-to-end encryption is a product requirement before finalising the data model. It changes search, recovery, collaboration and server-side scheduling capabilities.

## Delivery roadmap

### Phase 1 — Product foundation
- [x] Establish product direction and repository.
- [x] Create the public homepage foundation.
- [x] Create the application shell and navigation.
- [x] Add sample dashboard, inbox, archive, collections and open-when screens.
- [ ] Confirm brand identity, copy and design system.
- [ ] Add dedicated How it Works, Features, Privacy and Terms pages.

### Phase 2 — Creation experience
- [ ] Integrate Tiptap with a structured document schema.
- [ ] Add typography, colour, background and layout controls.
- [ ] Add image uploads, stickers and decorative elements.
- [ ] Add autosave and draft states.
- [ ] Add PNG/PDF export.
- [ ] Test keyboard navigation and accessible editor controls.

### Phase 3 — Accounts and persistence
- [ ] Configure Supabase project and environment variables.
- [ ] Implement sign-up, sign-in, recovery and protected routes.
- [ ] Create database migrations and RLS policies.
- [ ] Persist creations and media.
- [ ] Add profile and privacy settings.

### Phase 4 — Correspondence
- [ ] Implement recipients and delivery states.
- [ ] Create correspondence threads and replies.
- [ ] Add inbox, sent items and archive queries.
- [ ] Add guest recipient invitation and acceptance.
- [ ] Add transactional email notifications.

### Phase 5 — Collections and time-based writing
- [ ] Implement collaborative collections and contributor roles.
- [ ] Add invitation links and contribution moderation.
- [ ] Implement open-when rules and scheduled delivery.
- [ ] Enforce all release rules server-side.
- [ ] Add audit events for sensitive sharing and permission changes.

### Phase 6 — Production readiness
- [ ] Finalise legal documents with jurisdiction-appropriate review.
- [ ] Add error monitoring, analytics with privacy safeguards and operational alerts.
- [ ] Add automated unit, integration and end-to-end tests.
- [ ] Verify accessibility, performance, metadata and social previews.
- [ ] Configure production domains, email authentication and deployment secrets.
- [ ] Run a security review before inviting external users.

## Environment variables

No secrets are required for the current sample-data frontend.

When Supabase is introduced, create a local `.env.local` file:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only public client configuration belongs in variables prefixed with `VITE_`. Never put a Supabase service-role key, Resend API key or other server secret in frontend environment variables. Server secrets belong in Supabase function secrets or the deployment platform's server-side environment configuration.

## Working conventions

- Keep page components focused on composition and presentation.
- Put reusable UI in `components/`.
- Keep sample fixtures and types out of page files.
- Put data access behind service modules when backend work begins.
- Keep permissions in database policies and server functions, not just React conditionals.
- Use semantic HTML, visible focus states and accessible labels.
- Avoid committing credentials, real personal correspondence or private user data.
- Prefer small, reviewable changes with clear commit messages.

## Status

**Current status: first-pass frontend foundation.** This is not yet a production correspondence service. The README will be updated as real functionality replaces sample data.
