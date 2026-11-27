import { parseCloudCreation, parseCloudCreationPage } from './cloudCreationContract'
import type { CloudCreation } from './cloudCreationContract'
import type { StudioDocument } from '../studio/studioTypes'
import * as localCreationModule from './localCreations'

type TokenProvider = () => Promise<string>

const apiBase = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || (import.meta.env.DEV ? 'http://localhost:3001' : undefined))?.replace(/\/$/, '')

export class CloudApiError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code = 'REQUEST_FAILED') {
    super(message)
    this.name = 'CloudApiError'
    this.status = status
    this.code = code
  }
}

async function request<T>(tokenProvider: TokenProvider, path: string, init: RequestInit = {}): Promise<T> {
  if (!apiBase) throw new CloudApiError('The API address is not configured.', 0, 'API_NOT_CONFIGURED')
  const token = await tokenProvider()
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (response.status === 204) return undefined as T
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
    throw new CloudApiError(
      typeof error.message === 'string' ? error.message : 'The request could not be completed.',
      response.status,
      typeof error.code === 'string' ? error.code : 'REQUEST_FAILED',
    )
  }
  return payload as T
}

function creationFrom(value: unknown): CloudCreation {
  const parsed = parseCloudCreation(value)
  if (!parsed.ok) throw new CloudApiError(parsed.reason, 502, 'INVALID_API_RESPONSE')
  return parsed.value
}

export async function getCurrentProfile(token: TokenProvider) {
  return request<unknown>(token, '/v1/me')
}

export async function listCloudCreations(token: TokenProvider, status: 'draft' | 'archived' = 'draft'): Promise<CloudCreation[]> {
  const items: CloudCreation[] = []
  let cursor: string | null = null
  do {
    const query = new URLSearchParams({ status, limit: '50' })
    if (cursor) query.set('cursor', cursor)
    const raw = await request<unknown>(token, `/v1/creations?${query.toString()}`)
    const parsed = parseCloudCreationPage(raw)
    if (!parsed.ok) throw new CloudApiError(parsed.reason, 502, 'INVALID_API_RESPONSE')
    items.push(...parsed.value.items)
    cursor = parsed.value.nextCursor
  } while (cursor)
  return items
}

export async function getCloudCreation(token: TokenProvider, id: string): Promise<CloudCreation> {
  return creationFrom(await request(token, `/v1/creations/${encodeURIComponent(id)}`))
}

export async function createCloudCreation(token: TokenProvider, document: StudioDocument): Promise<CloudCreation> {
  return creationFrom(await request(token, '/v1/creations', {
    method: 'POST',
    body: JSON.stringify({ title: document.name, document }),
  }))
}

export async function updateCloudCreation(
  token: TokenProvider,
  id: string,
  document: StudioDocument,
  expectedRevision: number,
): Promise<CloudCreation> {
  return creationFrom(await request(token, `/v1/creations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: document.name, document, expectedRevision }),
  }))
}

export async function archiveCloudCreation(token: TokenProvider, id: string) {
  await request<void>(token, `/v1/creations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}


export interface AssetUploadResult {
  assetId: string
  imageUrl: string
}

export async function uploadCreationAsset(token: TokenProvider, file: File): Promise<AssetUploadResult> {
  const intent = await request<{ assetId: string; uploadUrl: string; requiredHeaders: Record<string, string> }>(token, '/v1/assets/upload-intents', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type, sizeBytes: file.size }),
  })
  const uploaded = await fetch(intent.uploadUrl, { method: 'PUT', headers: intent.requiredHeaders, body: file })
  if (!uploaded.ok) throw new CloudApiError('The photo could not be uploaded. Try again.', uploaded.status, 'ASSET_UPLOAD_FAILED')
  await request(token, `/v1/assets/${encodeURIComponent(intent.assetId)}/complete`, { method: 'POST' })
  const download = await request<{ url: string }>(token, `/v1/assets/${encodeURIComponent(intent.assetId)}/download-url`)
  return { assetId: intent.assetId, imageUrl: download.url }
}

export async function resolveCreationAssets(token: TokenProvider, document: StudioDocument): Promise<StudioDocument> {
  const elements = await Promise.all(document.elements.map(async (element) => {
    if (element.kind !== 'photo' || !element.imageAssetId) return element
    const result = await request<{ url: string }>(token, `/v1/assets/${encodeURIComponent(element.imageAssetId)}/download-url`)
    return { ...element, image: result.url }
  }))
  return { ...document, elements }
}

export function toCloudDocument(document: StudioDocument): StudioDocument {
  return {
    ...document,
    elements: document.elements.map((element) => {
      if (element.kind !== 'photo') return element
      const { image: _image, ...rest } = element
      return rest
    }),
  }
}

async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], name, { type: blob.type })
}

export async function uploadInlineCreationMedia(token: TokenProvider, document: StudioDocument): Promise<StudioDocument> {
  const elements = await Promise.all(document.elements.map(async (element, index) => {
    if (element.kind !== 'photo' || !element.image?.startsWith('data:')) return element
    const file = await dataUrlToFile(element.image, `lumie-photo-${index + 1}`)
    const uploaded = await uploadCreationAsset(token, file)
    return { ...element, imageAssetId: uploaded.assetId, image: uploaded.imageUrl }
  }))
  return { ...document, elements }
}

export function hasInlineMedia(document: StudioDocument) {
  return document.elements.some((element) => typeof element.image === 'string' && element.image.startsWith('data:'))
}

const IMPORT_KEY_PREFIX = 'lumie-cloud-imports-v1:'

function importMapKey(profileId: string) {
  return `${IMPORT_KEY_PREFIX}${profileId}`
}

function readImportMap(profileId: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(importMapKey(profileId)) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, string> : {}
  } catch {
    return {}
  }
}

export function getLocalImportSummary(profileId: string) {
  const imported = readImportMap(profileId)
  const local = localCreationModule.listLocalCreations()
  const pending = local.filter((item) => !imported[item.id] && !hasInlineMedia(item))
  const mediaBlocked = local.filter((item) => !imported[item.id] && hasInlineMedia(item))
  return { pending: pending.length, mediaBlocked: mediaBlocked.length, total: local.length }
}


export async function importLocalCreations(token: TokenProvider, profileId: string) {
  const imported = readImportMap(profileId)
  const local = localCreationModule.listLocalCreations()
  let importedCount = 0
  let mediaBlocked = 0
  for (const document of local) {
    if (imported[document.id]) continue
    if (hasInlineMedia(document)) {
      mediaBlocked += 1
      continue
    }
    const withAssets = await uploadInlineCreationMedia(token, document)
    const created = await createCloudCreation(token, toCloudDocument(withAssets))
    imported[document.id] = created.id
    localStorage.setItem(importMapKey(profileId), JSON.stringify(imported))
    importedCount += 1
  }
  return { importedCount, mediaBlocked }
}
