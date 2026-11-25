# Lumie — Product brief

## Product definition

Lumie is a creative correspondence platform for making, exchanging and preserving personal things. A creation may be a short note, a long-form letter, a visual composition, a memory page or a time-based message. The platform should feel expressive and enjoyable without forcing every user into one template or relationship type.

## Audience

Lumie is for all genders and a broad range of relationships and contexts:
- Friends and chosen family.
- Partners and relatives.
- People creating group gifts or occasion collections.
- People who want a private writing space.
- People preserving memories and meaningful exchanges.

Do not assume that users are women, that correspondence is romantic, or that every creation is addressed to another person.

## Product pillars

### 1. Create
A flexible editor with structured rich content. Support plain writing first, then typography, colour, backgrounds, images, decorative elements, layout blocks and export. The user can choose how expressive or minimal a creation should be.

### 2. Exchange
Users can address a creation to one or more recipients, send it through Lumie and receive replies in a correspondence thread. This is intentional, asynchronous correspondence, not a real-time chat interface.

### 3. Preserve
Users can keep private writing, sent items, received items and completed exchanges in a personal archive. Collections group creations by person, event, place, theme or any other user-defined idea.

### 4. Make together
A collection owner can invite contributors to add messages, notes or memories. Contributors should have explicit, limited permissions and should not automatically gain access to the owner's entire account or archive.

### 5. Open when
A user can create a message intended for a future date or a chosen moment. Date-based unlocks must be enforced by trusted server-side logic. The interface must never imply a locked message is secure merely because it is hidden in React.

## Content types

- Private note: visible only to its owner.
- Letter: a designed message addressed to a recipient.
- Memory page: a composition combining writing and media.
- Open-when message: a creation with a release rule.
- Collection contribution: a creation submitted to a shared collection.
- Correspondence reply: a message in an existing thread.

These are content intents, not mandatory layouts. The editor should remain flexible across types.

## Core user journeys

### Private writing
Sign up → create a private note → save draft → revisit from archive → optionally export or share later.

### Sending correspondence
Create a letter → personalise it → select recipient → review audience and sharing → send → recipient receives an invitation or in-app item → recipient replies → both participants can revisit the thread subject to permissions.

### Collaborative collection
Create collection → configure title and purpose → invite contributors → contributors accept → contributors submit items → owner reviews or moderates if configured → collection is shared with its intended audience.

### Open-when message
Create message → select recipient or self → choose date or availability rule → review access → schedule → server enforces release → eligible recipient is notified.

## Product rules

- New writing is private by default.
- Sharing must be explicit and explain who can access the content.
- A recipient should not be able to browse the sender's private archive.
- Collection membership is scoped to that collection.
- Invitation links need expiry, revocation and permission boundaries.
- The author should understand whether a message is a draft, scheduled, sent, delivered, opened or replied to.
- Do not promise delivery, encryption, privacy controls or deletion behaviour until implemented and tested.
- No real-time presence indicators or typing pressure in the first product direction.

## First release priorities

1. Account and profile foundations.
2. Flexible text-first creation and autosave.
3. Private archive.
4. Send to registered users and invited recipients.
5. Inbox and threaded replies.
6. Basic open-when scheduling.
7. Personal collections.
8. Guest-contributed collections after the permission model is proven.

Advanced collage tooling, extensive sticker libraries, voice notes, print fulfilment, paid plans and public discovery can follow after core correspondence works reliably.

## Success measures to consider

- Creation completion rate.
- Percentage of created items that are saved.
- Percentage of sent items that receive a reply.
- Repeat correspondence within 30 days.
- Collection contribution completion.
- Open-when creation and unlock engagement.
- User-reported confidence in privacy and sharing controls.

Avoid measuring success solely by time spent in the editor. Lumie should encourage meaningful exchanges, not endless engagement.
