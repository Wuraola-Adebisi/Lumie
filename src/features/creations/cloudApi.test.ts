import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDocument } from '../studio/studioTypes'
import { createCloudCreation, listCloudCreations, updateCloudCreation, uploadCreationAsset, resolveCreationAssets, toCloudDocument } from './cloudApi'

afterEach(() => vi.unstubAllGlobals())

describe('cloud API client', () => {
  it('sends authenticated requests and validates creation responses', async () => {
    const document = createDocument('letter')
    const response = {
      id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21',
      title: document.name,
      format: document.format,
      document,
      revision: 1,
      status: 'draft',
      createdAt: '2026-11-27T10:00:00.000Z',
      updatedAt: '2026-11-27T10:00:00.000Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createCloudCreation(async () => 'signed-access-token', document)

    expect(result.id).toBe(response.id)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/v1/creations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ authorization: 'Bearer signed-access-token' }),
      }),
    )
  })

  it('loads all cursor pages from the account library', async () => {
    const document = createDocument('letter')
    const makeItem = (id: string) => ({
      id,
      title: document.name,
      format: document.format,
      document,
      revision: 1,
      status: 'draft',
      createdAt: '2026-11-27T10:00:00.000Z',
      updatedAt: '2026-11-27T10:00:00.000Z',
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [makeItem('first')], nextCursor: 'next-page' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [makeItem('second')], nextCursor: null }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await listCloudCreations(async () => 'token')

    expect(result.map((item) => item.id)).toEqual(['first', 'second'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })


  it('uploads a photo, verifies it and requests a private read URL', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ assetId: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', uploadUrl: 'https://storage.test/upload', requiredHeaders: { 'Content-Type': 'image/png' } }), { status: 201 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ready' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: 'https://storage.test/private-photo' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' })
    const result = await uploadCreationAsset(async () => 'token', file)
    expect(result).toEqual({ assetId: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', imageUrl: 'https://storage.test/private-photo' })
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://storage.test/upload', expect.objectContaining({ method: 'PUT', body: file }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'http://localhost:3001/v1/assets/b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/complete', expect.objectContaining({ method: 'POST' }))
  })

  it('stores asset identifiers instead of expiring image URLs in cloud documents', () => {
    const document = createDocument()
    document.elements.push({ id: 'photo', kind: 'photo', x: 10, y: 10, width: 30, imageAssetId: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', image: 'https://storage.test/short-lived' })
    const cloud = toCloudDocument(document)
    expect(cloud.elements[cloud.elements.length - 1]).toMatchObject({ kind: 'photo', imageAssetId: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21' })
    expect(cloud.elements.at(-1)).not.toHaveProperty('image')
  })

  it('resolves private image URLs when opening a saved composition', async () => {
    const document = createDocument()
    document.elements.push({ id: 'photo', kind: 'photo', x: 10, y: 10, width: 30, imageAssetId: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ url: 'https://storage.test/refreshed-url' }), { status: 200 })))
    const resolved = await resolveCreationAssets(async () => 'token', document)
    expect(resolved.elements[resolved.elements.length - 1]?.image).toBe('https://storage.test/refreshed-url')
  })

  it('surfaces revision conflicts without retrying with stale state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'REVISION_CONFLICT',
      message: 'This creation changed elsewhere.',
    }), { status: 409 })))

    await expect(updateCloudCreation(async () => 'token', 'creation-id', createDocument(), 2))
      .rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' })
  })
})
