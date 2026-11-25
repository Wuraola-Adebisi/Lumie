export interface LegalSection {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDocument {
  eyebrow: string
  title: string
  intro: string
  updated: string
  notice?: string
  sections: LegalSection[]
}

const updated = 'Last updated: 25 November 2026'

export const privacyPolicy: LegalDocument = {
  eyebrow: 'YOUR INFORMATION',
  title: 'Privacy policy',
  intro: 'A clear explanation of what the current Lumie website and Creation Studio do with information, what they do not do yet, and what will need to change as connected features are introduced.',
  updated,
  notice: 'This policy describes the current pre-release frontend. It is not a statement that accounts, cloud storage, message delivery, analytics or other planned services are already operating. This policy must be reviewed and expanded before those features are launched.',
  sections: [
    { title: '1. Who operates Lumie?', paragraphs: ['Lumie is the product name for a creative correspondence platform in development. The legal name and address of the entity that will operate the public service, and its privacy contact, must be published here before account registration or other production data collection begins. Until those details are confirmed, do not treat this pre-release website as an invitation to submit sensitive or confidential information.'] },
    { title: '2. Information handled by the current version', paragraphs: ['The Creation Studio stores the active composition in your browser using local storage so that a draft can be restored on the same browser and device. A composition may include text you enter, formatting choices, layer positions, colours and images you upload.', 'When you upload an image in the current editor, the file is read in the browser and stored as part of the locally saved composition. The current editor limits an individual image upload to 3 MB. The image is not uploaded to a Lumie application server by this editor.', 'The website does not currently provide account registration, cloud synchronisation, message delivery, recipient profiles, shared collections or server-side scheduled messages. Do not enter payment details, passwords for other services, government identifiers or highly sensitive personal information into the editor.'] },
    { title: '3. Information held by your browser', paragraphs: ['Local drafts remain on the browser and device where they were created. They are not available to Lumie support and do not automatically move between browsers or devices. Clearing site data, browser storage or using certain private-browsing settings may remove a draft. Anyone with access to your browser profile or device may be able to access locally stored content. Use a device you control and avoid saving private material on a shared device.'] },
    { title: '4. Server and hosting information', paragraphs: ['When this website is hosted publicly, the hosting, content delivery, security or infrastructure providers may process technical information such as IP address, request time, browser and device details, requested URLs and security events as part of delivering and protecting the website. The actual providers, retention periods and applicable arrangements must be confirmed and named in this policy before public launch.'] },
    { title: '5. Cookies, analytics and advertising', paragraphs: ['The current frontend uses browser local storage for Creation Studio drafts. It does not currently require an account cookie for the editor, and no analytics or advertising integration has been intentionally added to this first release. Hosting or infrastructure providers may use strictly necessary technologies. If analytics, advertising, preference cookies or other tracking are introduced, this policy and the cookie notice must be updated and any legally required consent must be obtained before those technologies run.'] },
    { title: '6. Sharing and recipients', paragraphs: ['The current Creation Studio does not send compositions to recipients or publish them to shared collections. When sending, replies, invitations or collaborative collections are introduced, Lumie must explain what is shared, who can access it, how invitations work and how access can be withdrawn before a user confirms the action.'] },
    { title: '7. Retention and deletion', paragraphs: ['You can remove a local draft by clearing the relevant site data in your browser. The current frontend does not provide a remote account or server-side content deletion function. Future account, correspondence and media features will need defined retention periods, deletion workflows, backup handling and legal-retention exceptions before launch.'] },
    { title: '8. Security', paragraphs: ['Keep your device and browser account secure. The current local-first editor does not provide account authentication, encrypted cloud storage or secure message delivery. Those protections must not be assumed. Security controls for future accounts, uploads, correspondence and shared collections will be documented when implemented and tested.'] },
    { title: '9. Children and age requirements', paragraphs: ['Lumie has not yet published a final age policy for the connected service. Until an age policy and appropriate safeguards are established, the pre-release editor should not be used to submit personal information about children or sensitive information concerning a child. Any future age requirements will be stated before registration.'] },
    { title: '10. Your privacy rights', paragraphs: ['Depending on where you live, privacy law may give you rights to request access, correction, deletion, restriction, objection or portability, and to complain to a data protection authority. The process for exercising rights, the responsible legal entity and its contact details must be published before Lumie begins collecting personal information through production accounts or correspondence.'] },
    { title: '11. Changes to this policy', paragraphs: ['This policy will change as Lumie adds accounts, cloud storage, correspondence, invitations, notifications or other services. The revision date above will be updated when material changes are made. Where required by law, users will be notified or asked to make a new choice before a change takes effect.'] },
    { title: '12. Contact', paragraphs: ['A dedicated privacy contact address and the legal operator details have not yet been configured. They must be added before public launch. Do not send sensitive personal information through informal channels.'] },
  ],
}

export const termsOfService: LegalDocument = {
  eyebrow: 'THE TERMS',
  title: 'Terms of service',
  intro: 'The ground rules for using Lumie. These terms describe the current pre-release editor and the conditions that will apply as the wider correspondence service becomes available.',
  updated,
  notice: 'Pre-launch publication checklist: the legal operator name, registered or business address, support contact, governing law and dispute forum must be confirmed and inserted before accepting registrations or paid orders. This document is a working product draft, not a substitute for legal review.',
  sections: [
    { title: '1. About these terms', paragraphs: ['These terms govern access to the Lumie website and the features made available under the Lumie name (the Service). Lumie is a product name; the legal operator responsible for the Service must be identified on this page before the connected service launches. By using the Service, you agree to the terms that apply to the features you access. If you do not agree, do not use the Service.'] },
    { title: '2. Eligibility', paragraphs: ['You may use the Service only if you can legally agree to these terms under the laws that apply to you. If you are below the age of legal majority where you live, you may use any permitted feature only with the involvement and permission of a parent or legal guardian. Some future features may have additional age or eligibility requirements.'] },
    { title: '3. The current Service', paragraphs: ['The current release provides a frontend website and a browser-based Creation Studio. The editor lets you create compositions and store drafts locally in your browser. It does not currently provide accounts, cloud sync, message sending or receiving, replies, shared collections, scheduled delivery, paid subscriptions or physical mail fulfilment.', 'Features described as planned, in development or part of the product direction are not available unless and until they are visibly released. Do not rely on the website as a secure archive or delivery service.'] },
    { title: '4. Your content and responsibility', paragraphs: ['You retain ownership of the text, images and other material you create or upload, subject to rights belonging to other people. You are responsible for ensuring you have the rights and permissions needed to use any material you add. Do not upload content that violates another person’s privacy, intellectual property or other legal rights.', 'The current editor stores content locally in your browser. It does not transmit that content to Lumie for publication or delivery. If future features allow content to be hosted, shared or sent, the permissions and limited licence needed to operate those features will be explained before you use them.'] },
    { title: '5. Acceptable use', paragraphs: ['You must use Lumie lawfully and in accordance with the Acceptable Use Policy. You must not interfere with the website, attempt unauthorised access, distribute malware, misuse another person’s information, infringe rights, harass or threaten others, or use the Service to facilitate fraud or other unlawful conduct.'] },
    { title: '6. Privacy', paragraphs: ['The Privacy Policy explains how the current website and editor handle information. Review it before using the Service. Future account, communication, upload and collaboration features will be subject to an updated privacy notice before they are enabled.'] },
    { title: '7. Availability and changes', paragraphs: ['The Service is provided during development and may change, be interrupted or be withdrawn. We may add, modify or remove features as the product evolves. We will take reasonable steps to avoid unnecessary disruption, but you should keep your own copy of important content.'] },
    { title: '8. No guarantee of permanent storage or delivery', paragraphs: ['The current local draft feature depends on browser storage and is not a backup service. Lumie does not currently send, deliver, schedule or guarantee receipt of correspondence. Printing depends on your browser, operating system and printer settings.'] },
    { title: '9. Intellectual property', paragraphs: ['The Lumie name, brand identity, website design, software and materials provided by Lumie are protected by applicable intellectual property laws. You may use the Service for its intended personal purposes. You may not copy, redistribute, reverse engineer or commercially exploit Lumie materials except where applicable law permits or we give written permission.'] },
    { title: '10. Disclaimers and liability', paragraphs: ['To the extent permitted by law, the pre-release Service is provided on an “as is” and “as available” basis. Nothing in these terms excludes a consumer right or liability that cannot lawfully be excluded. Any limitation of liability for the production service must be reviewed and completed by the legal operator before launch.'] },
    { title: '11. Suspension and termination', paragraphs: ['Because the current release does not provide user accounts, there is no account suspension or closure workflow yet. If account-based services are introduced, the terms will explain when access may be restricted, how users may close accounts and what happens to retained content.'] },
    { title: '12. Governing law and disputes', paragraphs: ['The governing law, courts and dispute-resolution process must be completed once the legal operator and its establishment are confirmed. Mandatory consumer protections in the place where a user lives continue to apply where required by law.'] },
    { title: '13. Changes and contact', paragraphs: ['The revision date at the top of this page identifies the latest published version. Material changes will be reflected here and, where required, communicated before they apply. The legal operator’s name, address and support contact must be published here before the connected Service launches.'] },
  ],
}

export const acceptableUsePolicy: LegalDocument = {
  eyebrow: 'USE LUMIE THOUGHTFULLY',
  title: 'Acceptable use policy',
  intro: 'A practical standard for keeping Lumie creative, respectful and safe as private writing and correspondence features are introduced.',
  updated,
  sections: [
    { title: '1. Use the service lawfully', paragraphs: ['You may use Lumie only for lawful purposes and in compliance with these rules and the laws that apply to you. You are responsible for the content you create, upload or share.'] },
    { title: '2. Do not harm, threaten or harass', bullets: ['Do not threaten, intimidate, stalk, bully, harass or encourage violence against another person.', 'Do not use correspondence to send targeted abuse, hateful content or unwanted sexual material.', 'Do not impersonate another person or misrepresent your identity, affiliation or authority.', 'Do not use Lumie to facilitate exploitation, trafficking, grooming or abuse.'] },
    { title: '3. Respect privacy and consent', bullets: ['Do not publish or share another person’s private information without a lawful basis and appropriate permission.', 'Do not upload private letters, photographs, recordings or personal documents belonging to someone else unless you have permission to use them.', 'Do not use the service to expose, dox, blackmail or coerce another person.', 'Do not assume a draft is private if you are using a shared or unlocked device.'] },
    { title: '4. Respect intellectual property', paragraphs: ['Do not upload or distribute content that infringes copyright, trademark, privacy, publicity or other rights. If you use photographs, artwork, writing or other material created by someone else, make sure you have permission or another valid legal basis.'] },
    { title: '5. Prohibited technical activity', bullets: ['Do not probe, scan or test the vulnerability of Lumie systems without written authorisation.', 'Do not bypass access controls, scrape restricted content or attempt to access another person’s account or data.', 'Do not introduce malware, malicious scripts, phishing links or harmful files.', 'Do not overload, disrupt or interfere with the website or its infrastructure.', 'Do not reverse engineer or automate access in a way that violates the law or materially harms the service.'] },
    { title: '6. No fraud or unlawful transactions', paragraphs: ['Do not use Lumie to conduct scams, fraud, identity theft, money laundering, unlawful sales or other criminal activity. Lumie is not a payment processor, escrow service or marketplace in the current release.'] },
    { title: '7. Shared spaces and invitations', paragraphs: ['If collaborative collections or invitations are introduced, contributors must respect the collection purpose, access settings and the rights of other participants. Do not use an invitation to gain access to content beyond the permission granted. Report unexpected access or exposed content through the contact route published by Lumie.'] },
    { title: '8. Reporting and enforcement', paragraphs: ['The current pre-release editor does not yet provide an in-product reporting or moderation workflow. If you discover a security issue or harmful content associated with a future connected feature, use the official contact details published on the website. Lumie may investigate reports and restrict or remove access where permitted by law and the applicable terms.'] },
    { title: '9. Policy changes', paragraphs: ['This policy may be updated as accounts, sending, receiving and collaborative features become available. Continued use after a revised policy takes effect means you agree to follow the updated rules, to the extent permitted by law.'] },
  ],
}

export const cookieNotice: LegalDocument = {
  eyebrow: 'BROWSER STORAGE & COOKIES',
  title: 'Cookie notice',
  intro: 'What the current Lumie website stores in your browser, and how that may change if optional technologies are introduced.',
  updated,
  sections: [
    { title: '1. What the current editor stores', paragraphs: ['The Creation Studio uses local storage in your browser to save the current composition so it can be restored on the same device and browser. This is browser storage, not a cookie. It may contain the words, colours, layout settings and uploaded images in your draft.'] },
    { title: '2. Cookies', paragraphs: ['The current frontend does not intentionally set analytics, advertising or personalisation cookies. The website may be delivered through hosting or security infrastructure that uses strictly necessary technologies. The final hosting configuration must be reviewed before launch so this notice can name any cookies or similar technologies actually used.'] },
    { title: '3. Your choices', paragraphs: ['You can clear local site data through your browser settings. Doing so may permanently remove locally saved compositions. Browser controls can also block or delete cookies, although blocking essential infrastructure technologies may affect website operation.'] },
    { title: '4. Future optional technologies', paragraphs: ['If Lumie introduces analytics, advertising, embedded media, preference cookies or other non-essential tracking, this notice will be updated and any consent required by applicable law will be requested before those technologies are activated.'] },
    { title: '5. Contact', paragraphs: ['The privacy contact details will be published here before optional tracking or account-based services are introduced.'] },
  ],
}

export const accessibilityStatement: LegalDocument = {
  eyebrow: 'ACCESS FOR EVERYONE',
  title: 'Accessibility statement',
  intro: 'Lumie is intended to be usable by people with different access needs, devices and ways of interacting. Accessibility is an ongoing product requirement, not a one-time checklist.',
  updated,
  sections: [
    { title: '1. Our commitment', paragraphs: ['We aim to make the public website and Creation Studio perceivable, operable, understandable and robust. We use semantic page structure, readable text, clear controls and responsive layouts as a foundation.'] },
    { title: '2. Current limitations', paragraphs: ['The Creation Studio is an early implementation. Dragging layers is currently the primary way to reposition them, and full keyboard-based positioning, screen-reader announcements for every canvas change, and a complete accessibility audit have not yet been implemented. Some visual compositions may also rely on colour or spatial arrangement.'] },
    { title: '3. Improvements planned', bullets: ['Keyboard-accessible layer selection and positioning.', 'Clear focus indicators and consistent keyboard navigation.', 'Accessible names and state announcements for editor controls.', 'Contrast and text-resizing checks across public and app pages.', 'Reduced-motion support and testing with assistive technologies.'] },
    { title: '4. Feedback', paragraphs: ['A dedicated accessibility contact has not yet been configured. The operator must publish an accessible contact route before the public connected service launches.'] },
  ],
}
