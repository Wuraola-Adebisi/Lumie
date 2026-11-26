import type { ArtKind } from '../components/mail/Art'
import type { CardTone } from '../components/mail/Postcard3D'

export interface Creation { id: string; title: string; excerpt: string; kind: string; date: string; status: string; art: ArtKind; tone: CardTone }
export const recentCreations: Creation[] = [
  { id: '1', title: 'A note for ordinary days', excerpt: 'For the days that do not ask to be remembered.', kind: 'Private note', date: 'Today', status: 'Private', art: 'hills', tone: 'moss' },
  { id: '2', title: 'The things I forgot to say', excerpt: 'I keep thinking about that afternoon and the small things around it.', kind: 'Letter', date: 'Yesterday', status: 'Draft', art: 'doorway', tone: 'tomato' },
  { id: '3', title: 'Our archive', excerpt: 'Moments, photographs and words collected over a year.', kind: 'Memory page', date: 'Nov 20', status: 'Private', art: 'harbour', tone: 'saffron' },
]

export const inboxItems = [
  { id: '1', initials: 'AM', name: 'Alex Morgan', title: 'I kept thinking about this', preview: 'You said something last week that has stayed with me.', time: '10:42 AM', unread: true },
  { id: '2', initials: 'JS', name: 'Jamie Smith', title: 'A photograph for you', preview: 'I found the picture we took that day. It is attached.', time: 'Yesterday', unread: true },
  { id: '3', initials: 'RK', name: 'Riley K.', title: 'Re: The long way home', preview: 'That is how I remember it too.', time: 'Monday', unread: false },
]

export const collections = [
  { id: '1', title: 'The birthday book', description: 'Notes and memories from the people who know you best.', count: '12 contributions', label: 'Shared with you', arts: ['tins', 'harbour', 'hills'] as ArtKind[] },
  { id: '2', title: 'Places we have been', description: 'Short records of trips and the days around them.', count: '8 memories', label: 'Personal', arts: ['harbour', 'doorway', 'hills'] as ArtKind[] },
  { id: '3', title: 'For another time', description: 'Words to come back to when the moment is right.', count: '4 pieces', label: 'Personal', arts: ['doorway', 'tins', 'harbour'] as ArtKind[] },
]

export const openWhenItems = [
  { id: '1', title: 'Open when you need a reminder', unlock: 'Available any time', tone: 'saffron' as const, locked: false },
  { id: '2', title: 'Open on the first day of the new year', unlock: 'Unlocks January 1, 2027', tone: 'lilac' as const, locked: true },
  { id: '3', title: 'Open when you miss home', unlock: 'Available any time', tone: 'moss' as const, locked: false },
]
