import type { StudioDocument, StudioFormat } from '../studio/studioTypes'

export interface CloudCreation {
  id: string
  title: string
  format: StudioFormat
  document: StudioDocument
  revision: number
  status: 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface CloudCreationPage {
  items: CloudCreation[]
  nextCursor: string | null
}

export interface CloudApiError {
  code: string
  message: string
  requestId: string
}

export type ContractResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string }

const formats = new Set<StudioFormat>(['letter', 'postcard', 'photo-card', 'collage', 'memory'])
const MAX_DOCUMENT_BYTES = 1_048_576
const MAX_ELEMENTS = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDateTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function validDocument(value: unknown, expectedFormat: StudioFormat): value is StudioDocument {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== 2 || typeof value.id !== 'string' || !value.id) return false
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 80) return false
  if (value.format !== expectedFormat || typeof value.background !== 'string') return false
  if (!Array.isArray(value.elements) || value.elements.length > MAX_ELEMENTS) return false
  if (!isDateTime(value.updatedAt)) return false

  const ids = new Set<string>()
  for (const element of value.elements) {
    if (!isRecord(element) || typeof element.id !== 'string' || !element.id) return false
    if (ids.has(element.id)) return false
    ids.add(element.id)
    if (!['text', 'stamp', 'decoration', 'photo'].includes(String(element.kind))) return false
    if (typeof element.image === 'string' && element.image.startsWith('data:')) return false
    for (const key of ['x', 'y', 'width'] as const) {
      if (typeof element[key] !== 'number' || !Number.isFinite(element[key])) return false
    }
  }

  try {
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_DOCUMENT_BYTES) return false
  } catch {
    return false
  }
  return true
}

export function parseCloudCreation(value: unknown): ContractResult<CloudCreation> {
  if (!isRecord(value)) return { ok: false, reason: 'Creation response must be an object.' }
  if (typeof value.id !== 'string' || !value.id) return { ok: false, reason: 'Creation ID is missing.' }
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 80) {
    return { ok: false, reason: 'Creation title is invalid.' }
  }
  if (typeof value.format !== 'string' || !formats.has(value.format as StudioFormat)) {
    return { ok: false, reason: 'Creation format is invalid.' }
  }
  const format = value.format as StudioFormat
  if (!validDocument(value.document, format)) {
    return { ok: false, reason: 'Creation document is invalid or exceeds the supported limits.' }
  }
  if (!Number.isInteger(value.revision) || Number(value.revision) < 1) {
    return { ok: false, reason: 'Creation revision must be a positive integer.' }
  }
  if (value.status !== 'draft' && value.status !== 'archived') {
    return { ok: false, reason: 'Creation status is invalid.' }
  }
  if (!isDateTime(value.createdAt) || !isDateTime(value.updatedAt)) {
    return { ok: false, reason: 'Creation timestamps are invalid.' }
  }

  return {
    ok: true,
    value: {
      id: value.id,
      title: value.title,
      format,
      document: value.document,
      revision: Number(value.revision),
      status: value.status,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    },
  }
}

export function parseCloudCreationPage(value: unknown): ContractResult<CloudCreationPage> {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return { ok: false, reason: 'Creation page must contain an items array.' }
  }
  if (value.nextCursor !== undefined && value.nextCursor !== null && typeof value.nextCursor !== 'string') {
    return { ok: false, reason: 'Creation page cursor is invalid.' }
  }

  const items: CloudCreation[] = []
  for (const item of value.items) {
    const parsed = parseCloudCreation(item)
    if (!parsed.ok) return parsed
    items.push(parsed.value)
  }

  return { ok: true, value: { items, nextCursor: value.nextCursor as string | null ?? null } }
}
