import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDocument } from '../studio/studioTypes'
import { CloudApiError, createCloudCreation, listCloudCreations, updateCloudCreation } from './cloudApi'

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

  it('surfaces revision conflicts without retrying with stale state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 'REVISION_CONFLICT',
      message: 'This creation changed elsewhere.',
    }), { status: 409 })))

    await expect(updateCloudCreation(async () => 'token', 'creation-id', createDocument(), 2))
      .rejects.toMatchObject<Partial<CloudApiError>>({ status: 409, code: 'REVISION_CONFLICT' })
  })
})
