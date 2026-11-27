# Lumie — Product brief

## Product definition

Lumie is an AI-assisted creative correspondence platform for making, exchanging and preserving meaningful things. People can write in their own words, design letters and visual messages, and invite an assistant to help when they want another perspective. The assistant supports expression and creative decisions; it does not replace the author's judgement or take actions on their behalf.

Lumie's central product idea is the relationship between what someone wants to say, how they want to say it, how they want it presented and what they choose to preserve.

## Product thesis

Digital communication is optimised for speed, while traditional email is largely utilitarian. Lumie creates room for deliberate, expressive correspondence. Its AI layer should make it easier to begin, clarify intent, explore tone, shape visual compositions and revisit personal memories with consent. AI is a supporting capability across the product, not a chatbot bolted onto a stationery editor.

## Audience

Lumie is for all genders and a broad range of relationships and contexts: friends and chosen family, partners and relatives, group-gift organisers, private writers, memory keepers and people who want help expressing an idea without surrendering their voice.

Do not assume that users are women, that correspondence is romantic, or that every creation is addressed to another person.

## Product pillars

### Create
A flexible editor for letters, postcards, photo cards, collages and memory pages. Users control the words, typography, colours, backgrounds, images, decorative elements, layout and exports.

### Assist
An optional assistant helps users get started, explore tone, clarify an idea, revise a draft or translate a creative brief into editable design suggestions. Suggestions are proposals, never silent edits. Users can accept, reject, modify or ignore them.

### Exchange
Users can address a creation to recipients, send it through Lumie and receive replies in a correspondence thread. This is intentional, asynchronous correspondence, not a real-time chat interface.

### Preserve
Users keep private writing, sent items, received items and completed exchanges in a personal archive. Collections group creations by person, event, place, theme or any user-defined idea.

### Make together
Collection owners invite contributors to add messages, notes or memories with explicit, limited permissions.

### Open when
Users create messages intended for a future date or chosen moment. Unlocks must be enforced by trusted server-side logic.

## AI capability direction

- Writing companion: starting points, rewriting, expansion, shortening, clarity and tone exploration.
- Voice preservation: improve readability while retaining user-selected style and phrasing.
- Creative direction: turn a natural-language brief into structured, editable composition suggestions.
- Personal memory: opt-in retrieval across user-selected correspondence and collections, with links to source material.
- Collection assistance: organise selected contributions into a keepsake, with owner review.
- Reply assistance: prepare a reply using only context the user explicitly selects.

AI must not send, publish, schedule, share, delete or unlock correspondence without explicit user confirmation and server-side authorisation.

## AI MVP boundary

The pre-programme MVP may include a clearly labelled assistant preview using fixed sample responses. It must not call an external model, transmit prompts to an AI provider, imply that a live model is connected, or present sample output as generated intelligence. The product architecture defines provider-neutral contracts for later AWS Bedrock and NVIDIA integrations.

## Current MVP status

Implemented frontend: public site, responsive app shell, Creation Studio with five formats, structured rich text, image composition, local draft storage, PNG/print export and browser-based sample views. The assistant preview is a guided local interaction with fixed sample responses. There is no connected AI model, authentication, cloud persistence, actual sending/receiving or shared-collection backend.

## MVP validation target

A user can create and customise a piece, optionally explore the assistant preview, keep a local draft and export it. The next product milestone is persistent accounts and storage, followed by the first real correspondence loop. Programme applications must distinguish working MVP functionality from planned integrations.

## Success measures

Creation completion, saved/exported creations, assistant usefulness feedback, suggestion acceptance/edit/dismissal, reply rate once sending is live, repeat correspondence and user confidence in privacy and control. Do not optimise solely for time spent in the editor.
