# Legal and public-launch review checklist

The public-facing policy pages are implemented as working product drafts. They must be reconciled with the actual operator, deployment, data flows and jurisdictions before the connected service launches.

## Operator identity and contact

- [ ] Confirm the legal entity or individual operating Lumie.
- [ ] Confirm the registered/business address and any required registration details.
- [x] Publish a general support email: hello@lumiepost.com.
- [x] Publish a privacy/data-protection contact route: hello@lumiepost.com.
- [x] Publish accessibility feedback and security concern reporting routes through hello@lumiepost.com.
- [ ] Confirm whether a Data Protection Officer or other named privacy role is legally required.

## Jurisdiction and legal review

- [ ] Select the governing law and dispute forum based on the actual operating entity and target markets.
- [ ] Obtain review from qualified counsel for the applicable jurisdictions.
- [ ] Confirm the age threshold, parental-consent approach and child-safety requirements.
- [ ] Review consumer rights, electronic communications, intellectual property, intermediary liability and online safety obligations.
- [ ] Confirm whether paid plans, refunds, subscriptions or physical fulfilment will require additional terms.

## Data map and privacy operations

- [ ] Confirm the production hosting, CDN, database, authentication, storage, email, analytics and monitoring providers.
- [ ] Document each data category, purpose, lawful basis, recipient, international transfer and retention period.
- [ ] Confirm whether any cookies, local storage, SDKs or tracking pixels are active in production.
- [ ] Define data-subject request intake, identity verification, response timelines and escalation.
- [ ] Define account closure, content export, deletion, backup expiry and legal-hold procedures.
- [ ] Define security incident response and any required breach notification process.
- [ ] Complete processor agreements and transfer safeguards where required.
- [ ] Add a clear consent and permission model before sending, sharing or inviting contributors.

## Product and policy alignment

- [ ] Verify that every feature described as active in public copy is actually available.
- [ ] Update the Privacy Policy before account registration, cloud persistence, email notifications or analytics are enabled.
- [ ] Update the Terms before enabling user accounts, paid features, message delivery or user-to-user sharing.
- [ ] Implement reporting, blocking, moderation and appeal processes before enabling user-generated shared spaces.
- [ ] Implement server-side access controls and time-lock enforcement before describing content as private, restricted or scheduled.
- [ ] Add in-product links to the applicable policies at registration and before users send or share content.
- [ ] Record the policy version and acceptance timestamp where acceptance is legally required.
- [ ] Re-test accessibility and ensure the policies are available in readable, accessible formats.

## Current release facts to preserve

- Creation Studio drafts are stored in the browser's local storage.
- Uploaded images are included in the local composition data and are not uploaded by the current editor.
- Drafts do not synchronise between devices or accounts.
- The current frontend does not provide account registration, cloud storage, sending, receiving, replies, collaborative collections or server-side scheduled messages.
- Browser printing depends on the user's device, browser and printer configuration.
- Do not imply encryption, permanent storage, guaranteed delivery or server-side deletion until those capabilities are implemented and verified.
