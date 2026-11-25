# Technical architecture

## Current state

The current repository is a React + TypeScript + Vite frontend. It contains a public homepage, an application shell and sample-data views. Page interactions are local UI state only. There is no authentication, database, media upload, email delivery or scheduled job implementation yet.

## Frontend boundaries

- `pages/`: route-level composition.
- `components/marketing/`: public-site navigation and footer.
- `components/app/`: authenticated-product shell and navigation.
- `components/ui/`: shared visual primitives.
- `data/`: sample fixtures for the current prototype.

As backend work begins, introduce feature modules such as `features/auth`, `features/creations`, `features/correspondence`, `features/collections` and `features/open-when`. Keep API access and domain logic out of page components.

## Proposed platform services

### Supabase Auth
Use Supabase Auth for identity, sessions, email verification and account recovery. Protect application routes and derive the current user from the authenticated session.

### PostgreSQL
Use relational tables for profiles, creations, recipients, correspondence threads, messages, collections, collection memberships, contributions, unlock rules and media metadata.

### Row Level Security
RLS is mandatory. Define policies for each table based on owner identity, thread participation and collection membership. Start with deny-by-default policies. Do not rely on route guards or hidden buttons as security boundaries.

### Storage
Use private buckets for uploaded images and exports. Store metadata and object paths in PostgreSQL. Validate the requesting user's access before issuing signed URLs. Establish upload size, MIME type and image-processing limits.

### Server functions and schedules
Use trusted server-side functions for sending, invitation acceptance, scheduled delivery and unlock evaluation. Scheduled messages must not become accessible by changing client state or guessing an object URL.

### Transactional email
Use an email provider such as Resend for account-related and correspondence notifications. Email should notify recipients and provide a secure route into Lumie; it should not become the canonical message store.

## Suggested relational model

### profiles
- id (references auth.users)
- display_name
- avatar_path
- locale
- created_at
- updated_at

### creations
- id
- owner_id
- title
- content_type
- document_json
- visibility
- lifecycle_status
- created_at
- updated_at
- archived_at

### correspondence_threads
- id
- created_by
- subject
- created_at
- updated_at

### thread_participants
- thread_id
- user_id or invited_recipient_id
- participant_role
- joined_at
- left_at

### messages
- id
- thread_id
- creation_id
- sender_id
- sent_at
- delivery_status

### recipients
- id
- creation_id
- recipient_user_id or recipient_email
- invitation_token_hash
- invitation_expires_at
- accepted_at
- delivery_status

### collections
- id
- owner_id
- title
- description
- visibility
- contribution_mode
- created_at
- updated_at

### collection_members
- collection_id
- user_id
- role
- invited_by
- joined_at

### collection_contributions
- id
- collection_id
- author_id
- creation_id
- moderation_status
- submitted_at

### unlock_rules
- id
- creation_id
- recipient_id
- rule_type
- unlock_at
- timezone
- status

### media_assets
- id
- owner_id
- creation_id
- storage_path
- media_type
- file_size
- created_at

The final schema should be migration-driven and reviewed against the exact sharing and guest-recipient journeys before production use.

## Editor document model

Persist editor content as structured JSON with a versioned schema. A document should represent content blocks and their attributes rather than storing only a screenshot or HTML string. This enables editing, export, future schema migrations and responsive rendering.

Tiptap is the planned editor foundation. Keep custom nodes/extensions scoped to product requirements. Build plain text and basic formatting first; add media, stickers and freeform layout after the persistence and export model is stable.

## Security decisions to make before launch

- Decide whether Lumie needs end-to-end encryption. It materially affects search, collaboration, account recovery, export and scheduled delivery.
- Define guest access and whether guests must create accounts to reply.
- Define recipient consent, invitation expiry and token revocation.
- Decide whether collection owners can edit, remove or moderate contributions.
- Define retention, backup, deletion and legal hold requirements.
- Define rate limits and abuse reporting for invitations and sending.
- Ensure logs and analytics never capture letter bodies or sensitive media by default.

## Deployment

The current Vite application can be deployed to Vercel or another static hosting provider. Configure environment variables per environment. Do not commit secrets. Production should include a verified domain, canonical metadata, social preview images, error monitoring, security headers and automated checks.

## Environment variables

The current prototype needs no runtime secrets. When Supabase is connected, the browser may receive only the Supabase project URL and public anon/publishable key. Service-role credentials, email-provider API keys and other privileged secrets must remain server-side.
