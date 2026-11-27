const MAX_BODY_BYTES = 1_048_576
const FORMATS = new Set(['letter', 'postcard', 'photo-card', 'collage', 'memory'])

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
    body: body === undefined ? '' : JSON.stringify(body),
  }
}

function parseBody(event) {
  if (!event.body) return { ok: false }
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return { ok: false, tooLarge: true }
    const value = JSON.parse(raw)
    return value && typeof value === 'object' && !Array.isArray(value)
      ? { ok: true, value }
      : { ok: false }
  } catch {
    return { ok: false }
  }
}

function validDocument(document, format) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) return false
  if (document.schemaVersion !== 2 || typeof document.id !== 'string' || !document.id) return false
  if (typeof document.name !== 'string' || !document.name.trim() || document.name.length > 80) return false
  if (document.format !== format || typeof document.background !== 'string') return false
  if (!Array.isArray(document.elements) || document.elements.length > 100) return false
  if (typeof document.updatedAt !== 'string' || !Number.isFinite(Date.parse(document.updatedAt))) return false
  const ids = new Set()
  for (const element of document.elements) {
    if (!element || typeof element !== 'object' || Array.isArray(element)) return false
    if (typeof element.id !== 'string' || !element.id || ids.has(element.id)) return false
    ids.add(element.id)
    if (typeof element.image === 'string' && element.image.startsWith('data:')) return false
    if (!['text', 'stamp', 'decoration', 'photo'].includes(element.kind)) return false
    for (const key of ['x', 'y', 'width']) {
      if (typeof element[key] !== 'number' || !Number.isFinite(element[key])) return false
    }
  }
  try {
    return Buffer.byteLength(JSON.stringify(document), 'utf8') <= MAX_BODY_BYTES
  } catch {
    return false
  }
}

function encodeCursor(row) {
  return Buffer.from(JSON.stringify({ updatedAt: row.updated_at, id: row.id })).toString('base64url')
}

function decodeCursor(value) {
  if (!value) return null
  if (typeof value !== 'string' || value.length > 512) return undefined
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!parsed || typeof parsed.updatedAt !== 'string' || !Number.isFinite(Date.parse(parsed.updatedAt))) return undefined
    if (typeof parsed.id !== 'string') return undefined
    return parsed
  } catch {
    return undefined
  }
}

function mapCreation(row) {
  return {
    id: row.id,
    title: row.title,
    format: row.format,
    document: row.document_json,
    revision: row.revision,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

async function withAccount(pool, cognitoSub, operation) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.cognito_sub', $1, true)", [cognitoSub])
    await client.query(
      'INSERT INTO profiles (cognito_sub) VALUES ($1) ON CONFLICT (cognito_sub) DO NOTHING',
      [cognitoSub],
    )
    const profile = await client.query(
      'SELECT id, display_name, avatar_asset_id, locale, time_zone, created_at FROM profiles WHERE cognito_sub = $1',
      [cognitoSub],
    )
    if (profile.rowCount !== 1) throw new Error('Account profile could not be resolved.')
    const userId = profile.rows[0].id
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId])
    const result = await operation(client, profile.rows[0])
    await client.query('COMMIT')
    return result
  } catch (error) {
    try { await client.query('ROLLBACK') } catch { /* preserve the original error */ }
    throw error
  } finally {
    client.release()
  }
}

function profileResponse(profile) {
  return {
    id: profile.id,
    displayName: profile.display_name,
    avatarAssetId: profile.avatar_asset_id,
    locale: profile.locale,
    timeZone: profile.time_zone,
    createdAt: new Date(profile.created_at).toISOString(),
  }
}

/**
 * Creates an API Gateway HTTP API v2 handler.
 * The event must come from an API Gateway JWT authorizer configured for Cognito.
 * Do not invoke this handler with browser-decoded JWT claims.
 */
export function createApiHandler({ pool, logger = console }) {
  if (!pool || typeof pool.connect !== 'function') throw new TypeError('A PostgreSQL pool is required.')

  return async function handler(event) {
    const claims = event?.requestContext?.authorizer?.jwt?.claims
    const cognitoSub = claims?.sub
    const issuer = claims?.iss
    const tokenUse = claims?.token_use
    if (typeof cognitoSub !== 'string' || !cognitoSub || typeof issuer !== 'string' ||
      tokenUse !== 'access') {
      return response(401, { code: 'UNAUTHORIZED', message: 'Sign in to continue.' })
    }

    const method = event.requestContext?.http?.method?.toUpperCase()
    const path = event.rawPath || event.requestContext?.http?.path || ''
    const creationMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})$/i)
    const revisionsMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})\/revisions$/i)

    try {
      if (method === 'GET' && path === '/v1/me') {
        const profile = await withAccount(pool, cognitoSub, async (_client, row) => profileResponse(row))
        return response(200, profile)
      }

      if (method === 'GET' && path === '/v1/creations') {
        const query = event.queryStringParameters || {}
        const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit || '20', 10) || 20))
        const cursor = decodeCursor(query.cursor)
        if (cursor === undefined) return response(400, { code: 'INVALID_CURSOR', message: 'The page cursor is invalid.' })
        if (query.status && !['draft', 'archived'].includes(query.status)) {
          return response(400, { code: 'INVALID_STATUS', message: 'The requested status is invalid.' })
        }
        const page = await withAccount(pool, cognitoSub, async (client) => {
          const values = []
          let where = ''
          if (query.status === 'archived') where = "WHERE status = 'archived'"
          else if (query.status === 'draft') where = "WHERE status = 'draft'"
          else where = "WHERE status = 'draft'"
          if (cursor) {
            values.push(cursor.updatedAt, cursor.id)
            where += \` AND (updated_at, id) < ($\${values.length - 1}::timestamptz, $\${values.length}::uuid)\`
          }
          values.push(limit + 1)
          const result = await client.query(
            \`SELECT id, title, format, document_json, revision, status, created_at, updated_at
             FROM creations \${where} ORDER BY updated_at DESC, id DESC LIMIT $\${values.length}\`,
            values,
          )
          const hasMore = result.rows.length > limit
          const rows = result.rows.slice(0, limit)
          return {
            items: rows.map(mapCreation),
            nextCursor: hasMore ? encodeCursor(rows[rows.length - 1]) : null,
          }
        })
        return response(200, page)
      }

      if (method === 'POST' && path === '/v1/creations') {
        const body = parseBody(event)
        if (!body.ok) return response(body.tooLarge ? 413 : 400, {
          code: body.tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INVALID_BODY',
          message: body.tooLarge ? 'The creation is too large.' : 'A valid JSON object is required.',
        })
        const { title, document } = body.value
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 80 ||
          !FORMATS.has(document?.format) || !validDocument(document, document.format)) {
          return response(400, { code: 'INVALID_CREATION', message: 'The creation details are invalid.' })
        }
        const created = await withAccount(pool, cognitoSub, async (client, profile) => {
          const result = await client.query(
            \`INSERT INTO creations (owner_id, title, format, document_json)
             VALUES ($1, $2, $3, $4::jsonb)
             RETURNING id, title, format, document_json, revision, status, created_at, updated_at\`,
            [profile.id, title.trim(), document.format, JSON.stringify(document)],
          )
          const row = result.rows[0]
          await client.query(
            'INSERT INTO creation_revisions (creation_id, owner_id, revision, document_json) VALUES ($1, $2, 1, $3::jsonb)',
            [row.id, profile.id, JSON.stringify(document)],
          )
          return mapCreation(row)
        })
        return response(201, created)
      }

      if (method === 'GET' && creationMatch) {
        const item = await withAccount(pool, cognitoSub, async (client) => {
          const result = await client.query(
            \`SELECT id, title, format, document_json, revision, status, created_at, updated_at
             FROM creations WHERE id = $1 AND status = 'draft'\`,
            [creationMatch[1]],
          )
          return result.rowCount ? mapCreation(result.rows[0]) : null
        })
        return item ? response(200, item) : response(404, { code: 'NOT_FOUND', message: 'Creation not found.' })
      }

      if (method === 'PATCH' && creationMatch) {
        const body = parseBody(event)
        if (!body.ok) return response(body.tooLarge ? 413 : 400, { code: 'INVALID_BODY', message: 'A valid JSON object is required.' })
        const { title, document, expectedRevision } = body.value
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 80 ||
          !Number.isInteger(expectedRevision) || expectedRevision < 1 ||
          !FORMATS.has(document?.format) || !validDocument(document, document.format)) {
          return response(400, { code: 'INVALID_CREATION', message: 'The creation details are invalid.' })
        }
        const result = await withAccount(pool, cognitoSub, async (client, profile) => {
          const updated = await client.query(
            \`UPDATE creations SET title = $1, format = $2, document_json = $3::jsonb,
               revision = revision + 1
             WHERE id = $4 AND revision = $5 AND status = 'draft'
             RETURNING id, title, format, document_json, revision, status, created_at, updated_at\`,
            [title.trim(), document.format, JSON.stringify(document), creationMatch[1], expectedRevision],
          )
          if (!updated.rowCount) {
            const exists = await client.query('SELECT 1 FROM creations WHERE id = $1', [creationMatch[1]])
            return exists.rowCount ? { conflict: true } : null
          }
          const row = updated.rows[0]
          await client.query(
            'INSERT INTO creation_revisions (creation_id, owner_id, revision, document_json) VALUES ($1, $2, $3, $4::jsonb)',
            [row.id, profile.id, row.revision, JSON.stringify(document)],
          )
          return { creation: mapCreation(row) }
        })
        if (!result) return response(404, { code: 'NOT_FOUND', message: 'Creation not found.' })
        if (result.conflict) return response(409, { code: 'REVISION_CONFLICT', message: 'This creation changed elsewhere. Reload the latest version before saving.' })
        return response(200, result.creation)
      }

      if (method === 'DELETE' && creationMatch) {
        const archived = await withAccount(pool, cognitoSub, async (client) => {
          const result = await client.query(
            "UPDATE creations SET status = 'archived', archived_at = now() WHERE id = $1 AND status = 'draft' RETURNING id",
            [creationMatch[1]],
          )
          return result.rowCount > 0
        })
        return archived ? response(204) : response(404, { code: 'NOT_FOUND', message: 'Creation not found.' })
      }

      if (method === 'GET' && revisionsMatch) {
        const revisions = await withAccount(pool, cognitoSub, async (client) => {
          const result = await client.query(
            \`SELECT r.id, r.revision, r.document_json, r.created_at
             FROM creation_revisions r
             JOIN creations c ON c.id = r.creation_id
             WHERE r.creation_id = $1 ORDER BY r.revision DESC\`,
            [revisionsMatch[1]],
          )
          return result.rows.map(row => ({
            id: row.id,
            revision: row.revision,
            document: row.document_json,
            createdAt: new Date(row.created_at).toISOString(),
          }))
        })
        return response(200, revisions)
      }

      return response(404, { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' })
    } catch (error) {
      logger.error?.('Lumie API request failed', { error })
      return response(500, { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' })
    }
  }
}
