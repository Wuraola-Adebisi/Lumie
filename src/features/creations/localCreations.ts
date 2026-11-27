import { migrateStudioDocument } from '../studio/studioTypes'
import type { StudioDocument, StudioRichTextNode } from '../studio/studioTypes'

export const CREATIONS_STORAGE_KEY = 'lumie-creations-v1'
const LEGACY_DRAFT_KEY = 'lumie-studio-draft-v1'

type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function normalise(value: unknown): StudioDocument | null {
  const migrated = migrateStudioDocument(value)
  if (!migrated || typeof migrated.id !== 'string' || !Array.isArray(migrated.elements)) return null
  return migrated
}

function readStored(storage: StoragePort): StudioDocument[] {
  try {
    const raw = storage.getItem(CREATIONS_STORAGE_KEY)
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.map(normalise).filter((item): item is StudioDocument => item !== null)
        }
      } catch {
        // A damaged library should not prevent recovery of the previous draft.
      }
    }

    const legacyRaw = storage.getItem(LEGACY_DRAFT_KEY)
    if (!legacyRaw) return []
    const legacy = normalise(JSON.parse(legacyRaw))
    if (!legacy) return []

    storage.setItem(CREATIONS_STORAGE_KEY, JSON.stringify([legacy]))
    storage.removeItem(LEGACY_DRAFT_KEY)
    return [legacy]
  } catch {
    return []
  }
}

export function listLocalCreations(storage: StoragePort = window.localStorage): StudioDocument[] {
  return readStored(storage).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function getLocalCreation(id: string, storage: StoragePort = window.localStorage): StudioDocument | null {
  return listLocalCreations(storage).find((item) => item.id === id) ?? null
}

export function saveLocalCreation(document: StudioDocument, storage: StoragePort = window.localStorage): boolean {
  try {
    const existing = readStored(storage).filter((item) => item.id !== document.id)
    storage.setItem(CREATIONS_STORAGE_KEY, JSON.stringify([...existing, document]))
    return true
  } catch {
    return false
  }
}

export function deleteLocalCreation(id: string, storage: StoragePort = window.localStorage): boolean {
  try {
    const remaining = readStored(storage).filter((item) => item.id !== id)
    storage.setItem(CREATIONS_STORAGE_KEY, JSON.stringify(remaining))
    return true
  } catch {
    return false
  }
}

export function renameLocalCreation(id: string, name: string, storage: StoragePort = window.localStorage): boolean {
  const cleanName = name.trim().slice(0, 80)
  if (!cleanName) return false
  const document = getLocalCreation(id, storage)
  if (!document) return false
  return saveLocalCreation({ ...document, name: cleanName, updatedAt: new Date().toISOString() }, storage)
}

function collectText(node: StudioRichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return ' '
  const children = (node.content ?? []).map(collectText).filter(Boolean)
  return ['paragraph', 'heading', 'listItem', 'blockquote'].includes(node.type)
    ? children.join('')
    : children.join(' ')
}

export function getCreationExcerpt(document: StudioDocument, maxLength = 140): string {
  const text = document.elements
    .filter((element) => element.kind === 'text')
    .map((element) => element.richText ? collectText(element.richText) : element.text ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 'A blank page, ready for your words.'
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text
}

export function getFormatLabel(format: StudioDocument['format']): string {
  return {
    letter: 'Letter',
    postcard: 'Postcard',
    'photo-card': 'Photo card',
    collage: 'Collage',
    memory: 'Memory page',
  }[format]
}
