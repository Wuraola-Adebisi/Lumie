import { describe, expect, it, vi } from 'vitest'
import { createApiHandler } from './api.mjs'

const profile = {
  id: '7f1c2e6a-2c1b-4a5b-8c3d-1a2b3c4d5e6f',
  display_name: 'Writer',
  avatar_asset_id: null,
  locale: 'en',
  time_zone: 'Africa/Lagos',
  created_at: new Date('2026-11-27T10:00:00.000Z'),
}

function makePool(queryHandler = async () => ({ rows: [], rowCount: 0 })) {
  const queries: Array<{ sql: string; values?: unknown[] }> = []
  const client = {
    query: vi.fn(async (sql: string, values?: unknown[]) => {
      queries.push({ sql, values })
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 }
      if (sql.includes("set_config('app.cognito_sub'")) return { rows: [], rowCount: 1 }
      if (sql.includes('INSERT INTO profiles')) return { rows: [], rowCount: 1 }
      if (sql.includes('FROM profiles WHERE cognito_sub')) return { rows: [profile], rowCount: 1 }
      if (sql.includes("set_config('app.user_id'")) return { rows: [], rowCount: 1 }
      return queryHandler(sql, values)
    }),
    release: vi.fn(),
  }
  return {
    client,
    queries,
    pool: { connect: vi.fn(async () => client) },
  }
}

function event(method: string, path: string, options: Record<string, unknown> = {}) {
  return {
    rawPath: path,
    requestContext: {
      http: { method },
      authorizer: {
        jwt: {
          claims: {
            sub: 'cognito-subject-1',
            iss: 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_example',
            token_use: 'access',
          },
        },
      },
    },
    ...options,
  }
}

function document() {
  return {
    schemaVersion: 2,
    id: 'doc-1',
    name: 'A postcard',
    format: 'postcard',
    background: 'cream',
    elements: [],
    updatedAt: '2026-11-27T10:00:00.000Z',
  }
}

describe('Lumie API handler', () => {

  it('creates a private account-scoped upload intent', async () => {
    const { pool, queries } = makePool(async sql => sql.includes('INSERT INTO assets') ? { rows: [{ id: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', object_key: 'private/owner/asset', content_type: 'image/png' }], rowCount: 1 } : { rows: [], rowCount: 0 })
    const objectStore = { presignPut: vi.fn(() => 'https://storage.invalid/upload') }
    const handler = createApiHandler({ pool, objectStore })
    const result = await handler(event('POST', '/v1/assets/upload-intents', { body: JSON.stringify({ fileName: 'card.png', contentType: 'image/png', sizeBytes: 2048 }) }))
    expect(result.statusCode).toBe(201)
    expect(JSON.parse(result.body).requiredHeaders).toEqual({ 'Content-Type': 'image/png' })
    expect(queries.some(query => query.sql.includes('INSERT INTO assets'))).toBe(true)
    expect(objectStore.presignPut).toHaveBeenCalledWith('private/owner/asset', 'image/png', 300)
  })

  it('rejects unsupported media types before inserting an asset', async () => {
    const { pool, queries } = makePool()
    const handler = createApiHandler({ pool, objectStore: { presignPut: vi.fn() } })
    const result = await handler(event('POST', '/v1/assets/upload-intents', { body: JSON.stringify({ fileName: 'vector.svg', contentType: 'image/svg+xml', sizeBytes: 20 }) }))
    expect(result.statusCode).toBe(400)
    expect(queries.some(query => query.sql.includes('INSERT INTO assets'))).toBe(false)
  })

  it('marks an asset ready only after storage size and MIME type match', async () => {
    const { pool, queries } = makePool(async sql => sql.includes('SELECT id, object_key, content_type, size_bytes, status') ? { rows: [{ id: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', object_key: 'private/owner/asset', content_type: 'image/png', size_bytes: '2048', status: 'pending' }], rowCount: 1 } : { rows: [], rowCount: 1 })
    const objectStore = { headObject: vi.fn(async () => ({ contentLength: 2048, contentType: 'image/png' })) }
    const handler = createApiHandler({ pool, objectStore })
    const result = await handler(event('POST', '/v1/assets/b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/complete'))
    expect(result.statusCode).toBe(200)
    expect(queries.some(query => query.sql.includes("UPDATE assets SET status='ready'"))).toBe(true)
  })

  it('deletes and rejects an uploaded object with mismatched metadata', async () => {
    const { pool, queries } = makePool(async sql => sql.includes('SELECT id, object_key, content_type, size_bytes, status') ? { rows: [{ id: 'b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', object_key: 'private/owner/asset', content_type: 'image/png', size_bytes: '2048', status: 'pending' }], rowCount: 1 } : { rows: [], rowCount: 1 })
    const objectStore = { headObject: vi.fn(async () => ({ contentLength: 2048, contentType: 'image/jpeg' })), deleteObject: vi.fn(async () => {}) }
    const handler = createApiHandler({ pool, objectStore })
    const result = await handler(event('POST', '/v1/assets/b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/complete'))
    expect(result.statusCode).toBe(422)
    expect(objectStore.deleteObject).toHaveBeenCalledWith('private/owner/asset')
    expect(queries.some(query => query.sql.includes("UPDATE assets SET status='rejected'"))).toBe(true)
  })

  it('returns download URLs only for ready assets owned by the account', async () => {
    const { pool } = makePool(async sql => sql.includes("SELECT object_key FROM assets WHERE id=$1 AND status='ready'") ? { rows: [{ object_key: 'private/owner/asset' }], rowCount: 1 } : { rows: [], rowCount: 0 })
    const objectStore = { presignGet: vi.fn(() => 'https://storage.invalid/download') }
    const handler = createApiHandler({ pool, objectStore })
    const result = await handler(event('GET', '/v1/assets/b7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/download-url'))
    expect(result.statusCode).toBe(200)
    expect(JSON.parse(result.body).url).toBe('https://storage.invalid/download')
    expect(objectStore.presignGet).toHaveBeenCalledWith('private/owner/asset', 300)
  })

  it('rejects requests without verified authorizer claims before opening a database connection', async () => {
    const { pool } = makePool()
    const handler = createApiHandler({ pool })
    const result = await handler({ rawPath: '/v1/me', requestContext: { http: { method: 'GET' } } })
    expect(result.statusCode).toBe(401)
    expect(pool.connect).not.toHaveBeenCalled()
  })


  it('rejects ID tokens because API requests require Cognito access tokens', async () => {
    const { pool } = makePool()
    const handler = createApiHandler({ pool })
    const request = event('GET', '/v1/me')
    request.requestContext.authorizer.jwt.claims.token_use = 'id'
    const result = await handler(request)
    expect(result.statusCode).toBe(401)
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('provisions and returns the authenticated profile without exposing Cognito identity', async () => {
    const { pool, queries, client } = makePool()
    const handler = createApiHandler({ pool })
    const result = await handler(event('GET', '/v1/me'))
    const body = JSON.parse(result.body)
    expect(result.statusCode).toBe(200)
    expect(body).toMatchObject({ id: profile.id, displayName: 'Writer', timeZone: 'Africa/Lagos' })
    expect(body).not.toHaveProperty('cognitoSub')
    expect(body).not.toHaveProperty('email')
    expect(queries.some(query => query.sql.includes("set_config('app.cognito_sub'"))).toBe(true)
    expect(queries.some(query => query.sql.includes("set_config('app.user_id'"))).toBe(true)
    expect(client.release).toHaveBeenCalledOnce()
  })

  it('creates a creation and its immutable first revision in one transaction', async () => {
    const created = {
      id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21',
      title: 'A postcard',
      format: 'postcard',
      document_json: document(),
      revision: 1,
      status: 'draft',
      created_at: new Date('2026-11-27T10:00:00.000Z'),
      updated_at: new Date('2026-11-27T10:00:00.000Z'),
    }
    const { pool, queries } = makePool(async sql => {
      if (sql.includes('INSERT INTO creations')) return { rows: [created], rowCount: 1 }
      return { rows: [], rowCount: 1 }
    })
    const handler = createApiHandler({ pool })
    const result = await handler(event('POST', '/v1/creations', {
      body: JSON.stringify({ title: 'A postcard', document: document() }),
    }))
    expect(result.statusCode).toBe(201)
    expect(JSON.parse(result.body).revision).toBe(1)
    expect(queries.some(query => query.sql.includes('INSERT INTO creation_revisions'))).toBe(true)
    expect(queries.at(-1)?.sql).toBe('COMMIT')
  })

  it('rejects malformed documents before running creation SQL', async () => {
    const { pool, queries } = makePool()
    const handler = createApiHandler({ pool })
    const invalid = { ...document(), elements: [{ id: 'x', kind: 'text', x: Number.NaN, y: 0, width: 1 }] }
    const result = await handler(event('POST', '/v1/creations', {
      body: JSON.stringify({ title: 'Bad document', document: invalid }),
    }))
    expect(result.statusCode).toBe(400)
    expect(queries.some(query => query.sql.includes('INSERT INTO creations'))).toBe(false)
  })


  it('rejects embedded data URLs so binary media cannot be stored in document JSON', async () => {
    const { pool, queries } = makePool()
    const handler = createApiHandler({ pool })
    const withEmbeddedImage = {
      ...document(),
      elements: [{ id: 'photo-1', kind: 'photo', x: 0, y: 0, width: 50, image: 'data:image/png;base64,AAAA' }],
    }
    const result = await handler(event('POST', '/v1/creations', {
      body: JSON.stringify({ title: 'Photo card', document: withEmbeddedImage }),
    }))
    expect(result.statusCode).toBe(400)
    expect(queries.some(query => query.sql.includes('INSERT INTO creations'))).toBe(false)
  })

  it('returns a conflict when the expected revision is stale', async () => {
    const { pool } = makePool(async sql => {
      if (sql.includes('UPDATE creations')) return { rows: [], rowCount: 0 }
      if (sql.includes('SELECT 1 FROM creations')) return { rows: [{ '?column?': 1 }], rowCount: 1 }
      return { rows: [], rowCount: 0 }
    })
    const handler = createApiHandler({ pool })
    const result = await handler(event('PATCH', '/v1/creations/a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', {
      body: JSON.stringify({ title: 'Updated', document: document(), expectedRevision: 1 }),
    }))
    expect(result.statusCode).toBe(409)
    expect(JSON.parse(result.body).code).toBe('REVISION_CONFLICT')
  })

  it('rolls back and releases the client when a creation write fails', async () => {
    const { pool, client } = makePool(async sql => {
      if (sql.includes('INSERT INTO creations')) throw new Error('database unavailable')
      return { rows: [], rowCount: 0 }
    })
    const handler = createApiHandler({ pool, logger: { error: vi.fn() } })
    const result = await handler(event('POST', '/v1/creations', {
      body: JSON.stringify({ title: 'A postcard', document: document() }),
    }))
    expect(result.statusCode).toBe(500)
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalledOnce()
  })
})
