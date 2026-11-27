import { randomUUID } from 'node:crypto'
const MAX_BODY_BYTES = 1_048_576
const MAX_ASSET_BYTES = 10485760
const ASSET_TYPES = new Set(['image/jpeg','image/png','image/webp','image/avif'])
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

async function withAccount(pool, cognitoSub, operation, email = null) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.cognito_sub', $1, true)", [cognitoSub])
    await client.query(
      'INSERT INTO profiles (cognito_sub, email) VALUES ($1, $2) ON CONFLICT (cognito_sub) DO NOTHING',
      [cognitoSub, email],
    )
    const profile = await client.query(
      'SELECT id, display_name, avatar_asset_id, locale, time_zone, created_at FROM profiles WHERE cognito_sub = $1',
      [cognitoSub],
    )
    if (profile.rowCount !== 1) throw new Error('Account profile could not be resolved.')
    const userId = profile.rows[0].id
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId])
    if (email) await client.query('UPDATE profiles SET email = $2 WHERE id = $1 AND email IS DISTINCT FROM $2', [userId, email])
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
export function createApiHandler({ pool, objectStore, logger = console }) {
  if (!pool || typeof pool.connect !== 'function') throw new TypeError('A PostgreSQL pool is required.')

  return async function handler(event) {
    const claims = event?.requestContext?.authorizer?.jwt?.claims
    const cognitoSub = claims?.sub
    const issuer = claims?.iss
    const tokenUse = claims?.token_use
    const accountEmail = typeof claims?.email === 'string' ? claims.email.trim().toLowerCase() : null
    if (typeof cognitoSub !== 'string' || !cognitoSub || typeof issuer !== 'string' ||
      tokenUse !== 'access') {
      return response(401, { code: 'UNAUTHORIZED', message: 'Sign in to continue.' })
    }

    const method = event.requestContext?.http?.method?.toUpperCase()
    const path = event.rawPath || event.requestContext?.http?.path || ''
    const creationMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})$/i)
    const revisionsMatch = path.match(/^\/v1\/creations\/([0-9a-f-]{36})\/revisions$/i)
    const assetMatch = path.match(/^\/v1\/assets\/([0-9a-f-]{36})\/(complete|download-url)$/i)

    try {

      if (method === 'POST' && path === '/v1/assets/upload-intents') {
        if (!objectStore) return response(503, { code: 'STORAGE_UNAVAILABLE', message: 'Media storage is unavailable.' })
        const body = parseBody(event)
        if (!body.ok) return response(400, { code: 'INVALID_BODY', message: 'A valid JSON object is required.' })
        const { fileName, contentType, sizeBytes } = body.value
        if (typeof fileName !== 'string' || !fileName.trim() || fileName.length > 180 || !ASSET_TYPES.has(contentType) || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_ASSET_BYTES) return response(sizeBytes > MAX_ASSET_BYTES ? 413 : 400, { code: 'INVALID_UPLOAD', message: 'Choose a JPEG, PNG, WebP or AVIF image no larger than 10 MB.' })
        const id = randomUUID()
        const asset = await withAccount(pool, cognitoSub, async (client, account) => {
          const key = 'private/' + account.id + '/' + id
          const result = await client.query('INSERT INTO assets (id, owner_id, object_key, original_file_name, content_type, size_bytes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, object_key, content_type', [id, account.id, key, fileName.trim().replace(/[\\/\\\\\\u0000-\\u001f\\u007f]/g, '_'), contentType, sizeBytes])
          return result.rows[0]
        })
        const expiresIn = 300
        return response(201, { assetId: asset.id, uploadUrl: await objectStore.presignPut(asset.object_key, asset.content_type, expiresIn), expiresAt: new Date(Date.now()+expiresIn*1000).toISOString(), requiredHeaders: { 'Content-Type': asset.content_type } })
      }
      if (method === 'POST' && assetMatch?.[2] === 'complete') {
        if (!objectStore) return response(503, { code: 'STORAGE_UNAVAILABLE', message: 'Media storage is unavailable.' })
        const result = await withAccount(pool, cognitoSub, async client => {
          const found = await client.query("SELECT id, object_key, content_type, size_bytes, status FROM assets WHERE id=$1 AND status IN ('pending','ready')", [assetMatch[1]])
          if (!found.rowCount) return { missing: true }
          const a = found.rows[0]
          if (a.status === 'ready') return { ready: a.id }
          const actual = await objectStore.headObject(a.object_key)
          if (!actual) return { incomplete: true }
          if (actual.contentLength !== Number(a.size_bytes) || actual.contentType !== a.content_type) {
            await objectStore.deleteObject(a.object_key)
            await client.query("UPDATE assets SET status='rejected' WHERE id=$1", [a.id])
            return { rejected: true }
          }
          await client.query("UPDATE assets SET status='ready' WHERE id=$1", [a.id])
          return { ready: a.id }
        })
        if (result.missing) return response(404, { code: 'NOT_FOUND', message: 'Asset not found.' })
        if (result.incomplete) return response(409, { code: 'UPLOAD_INCOMPLETE', message: 'The image has not finished uploading.' })
        if (result.rejected) return response(422, { code: 'UPLOAD_REJECTED', message: 'Uploaded image details do not match the authorised file.' })
        return response(200, { assetId: result.ready, status: 'ready' })
      }
      if (method === 'GET' && assetMatch?.[2] === 'download-url') {
        if (!objectStore) return response(503, { code: 'STORAGE_UNAVAILABLE', message: 'Media storage is unavailable.' })
        const asset = await withAccount(pool, cognitoSub, async client => {
          const found = await client.query("SELECT object_key FROM assets WHERE id=$1 AND status='ready'", [assetMatch[1]])
          return found.rowCount ? found.rows[0] : null
        })
        if (!asset) return response(404, { code: 'NOT_FOUND', message: 'Asset not found.' })
        const expiresIn = 300
        return response(200, { assetId: assetMatch[1], url: await objectStore.presignGet(asset.object_key, expiresIn), expiresAt: new Date(Date.now()+expiresIn*1000).toISOString() })
      }

      if (method === 'GET' && path === '/v1/me') {
        const profile = await withAccount(pool, cognitoSub, async (_client, row) => profileResponse(row), accountEmail)
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
            where += ` AND (updated_at, id) < ($${values.length - 1}::timestamptz, $${values.length}::uuid)`
          }
          values.push(limit + 1)
          const result = await client.query(
            `SELECT id, title, format, document_json, revision, status, created_at, updated_at
             FROM creations ${where} ORDER BY updated_at DESC, id DESC LIMIT $${values.length}`,
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
            `INSERT INTO creations (owner_id, title, format, document_json)
             VALUES ($1, $2, $3, $4::jsonb)
             RETURNING id, title, format, document_json, revision, status, created_at, updated_at`,
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
            `SELECT id, title, format, document_json, revision, status, created_at, updated_at
             FROM creations WHERE id = $1 AND status = 'draft'`,
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
            `UPDATE creations SET title = $1, format = $2, document_json = $3::jsonb,
               revision = revision + 1
             WHERE id = $4 AND revision = $5 AND status = 'draft'
             RETURNING id, title, format, document_json, revision, status, created_at, updated_at`,
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
            `SELECT r.id, r.revision, r.document_json, r.created_at
             FROM creation_revisions r
             JOIN creations c ON c.id = r.creation_id
             WHERE r.creation_id = $1 ORDER BY r.revision DESC`,
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


      if (method === 'POST' && path === '/v1/correspondence') {
        const body = parseBody(event)
        if (!body.ok) return response(400, { code: 'INVALID_BODY', message: 'A valid JSON object is required.' })
        const recipientEmail = typeof body.value.recipientEmail === 'string' ? body.value.recipientEmail.trim().toLowerCase() : ''
        const creationId = body.value.creationId
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(recipientEmail) || typeof creationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(creationId)) {
          return response(400, { code: 'INVALID_CORRESPONDENCE', message: 'Choose a recipient email and a saved creation.' })
        }
        if (accountEmail && recipientEmail === accountEmail) return response(400, { code: 'SELF_SEND', message: 'Choose someone else to receive this letter.' })
        const sent = await withAccount(pool, cognitoSub, async (client, sender) => {
          const recipient = await client.query('SELECT profile_id, display_name FROM lumie_find_recipient_by_email($1)', [recipientEmail])
          if (!recipient.rowCount) return { recipientMissing: true }
          const creation = await client.query("SELECT id, title, format, document_json, revision FROM creations WHERE id=$1 AND status='draft'", [creationId])
          if (!creation.rowCount) return { creationMissing: true }
          const row = creation.rows[0]
          const assetIds = [...new Set((row.document_json.elements || []).map(item => item.imageAssetId).filter(value => typeof value === 'string'))]
          if (assetIds.length) {
            const ownedAssets = await client.query("SELECT id FROM assets WHERE id = ANY($1::uuid[]) AND status='ready'", [assetIds])
            if (ownedAssets.rowCount !== assetIds.length) return { assetsUnavailable: true }
          }
          const thread = await client.query("INSERT INTO correspondence_threads (created_by, subject) VALUES ($1,$2) RETURNING id, subject, created_at", [sender.id, row.title])
          const threadId = thread.rows[0].id
          await client.query("INSERT INTO correspondence_participants (thread_id, profile_id, role) VALUES ($1,$2,'sender'),($1,$3,'recipient')", [threadId, sender.id, recipient.rows[0].profile_id])
          await client.query("INSERT INTO correspondence_messages (thread_id, sender_id, creation_id, creation_revision, snapshot) VALUES ($1,$2,$3,$4,$5::jsonb)", [threadId, sender.id, row.id, row.revision, JSON.stringify({ title: row.title, format: row.format, document: row.document_json })])
          for (const assetId of assetIds) await client.query('INSERT INTO asset_thread_grants (asset_id, thread_id, granted_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [assetId, threadId, sender.id])
          return { threadId, subject: thread.rows[0].subject, recipientName: recipient.rows[0].display_name }
        }, accountEmail)
        if (sent.recipientMissing) return response(404, { code: 'RECIPIENT_NOT_FOUND', message: 'No Lumie account is registered with that email address yet.' })
        if (sent.creationMissing) return response(404, { code: 'CREATION_NOT_FOUND', message: 'That saved creation could not be found.' })
        if (sent.assetsUnavailable) return response(409, { code: 'ASSET_UNAVAILABLE', message: 'One or more photos are no longer available. Reopen the creation and try again.' })
        return response(201, { threadId: sent.threadId, subject: sent.subject, recipientName: sent.recipientName })
      }

      if (method === 'GET' && path === '/v1/inbox') {
        const inbox = await withAccount(pool, cognitoSub, async (client, account) => {
          const result = await client.query(
            `SELECT t.id, t.subject, t.created_at, t.last_message_at, cp.role,
              (SELECT m.snapshot->>'title' FROM correspondence_messages m WHERE m.thread_id=t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_title,
              (SELECT m.created_at FROM correspondence_messages m WHERE m.thread_id=t.id ORDER BY m.created_at DESC LIMIT 1) AS latest_message_at,
              (SELECT p.display_name FROM correspondence_participants other_cp JOIN profiles p ON p.id=other_cp.profile_id WHERE other_cp.thread_id=t.id AND other_cp.profile_id<>$1 LIMIT 1) AS correspondent_name
             FROM correspondence_threads t
             JOIN correspondence_participants cp ON cp.thread_id=t.id
             WHERE cp.profile_id=$1
             ORDER BY t.last_message_at DESC LIMIT 100`,
            [account.id],
          )
          return result.rows.map(row => ({ id: row.id, subject: row.subject, role: row.role, correspondentName: row.correspondent_name || 'Lumie member', latestTitle: row.latest_title, createdAt: new Date(row.created_at).toISOString(), lastMessageAt: new Date(row.latest_message_at || row.last_message_at).toISOString() }))
        }, accountEmail)
        return response(200, { items: inbox })
      }

      const threadMatch = path.match(/^\/v1\/threads\/([0-9a-f-]{36})$/i)
      const replyMatch = path.match(/^\/v1\/threads\/([0-9a-f-]{36})\\/replies$/i)
      if (method === 'GET' && threadMatch) {
        const thread = await withAccount(pool, cognitoSub, async (client, account) => {
          const access = await client.query('SELECT t.id, t.subject FROM correspondence_threads t JOIN correspondence_participants cp ON cp.thread_id=t.id WHERE t.id=$1 AND cp.profile_id=$2', [threadMatch[1], account.id])
          if (!access.rowCount) return null
          await client.query('UPDATE correspondence_participants SET last_read_at=now() WHERE thread_id=$1 AND profile_id=$2', [threadMatch[1], account.id])
          const messages = await client.query(
            `SELECT m.id, m.sender_id, p.display_name AS sender_name, m.snapshot, m.created_at
             FROM correspondence_messages m JOIN profiles p ON p.id=m.sender_id
             WHERE m.thread_id=$1 ORDER BY m.created_at ASC, m.id ASC`,
            [threadMatch[1]],
          )
          return { id: access.rows[0].id, subject: access.rows[0].subject, messages: messages.rows.map(row => ({ id: row.id, senderId: row.sender_id, senderName: row.sender_name || 'Lumie member', snapshot: row.snapshot, sentAt: new Date(row.created_at).toISOString() })) }
        }, accountEmail)
        return thread ? response(200, thread) : response(404, { code: 'NOT_FOUND', message: 'Correspondence not found.' })
      }

      if (method === 'POST' && replyMatch) {
        const body = parseBody(event)
        if (!body.ok || !body.value.snapshot || typeof body.value.snapshot !== 'object' || Array.isArray(body.value.snapshot)) return response(400, { code: 'INVALID_REPLY', message: 'A letter or message is required.' })
        const reply = await withAccount(pool, cognitoSub, async (client, account) => {
          const access = await client.query('SELECT t.id FROM correspondence_threads t JOIN correspondence_participants cp ON cp.thread_id=t.id WHERE t.id=$1 AND cp.profile_id=$2', [replyMatch[1], account.id])
          if (!access.rowCount) return null
          const inserted = await client.query('INSERT INTO correspondence_messages (thread_id, sender_id, snapshot) VALUES ($1,$2,$3::jsonb) RETURNING id, created_at', [replyMatch[1], account.id, JSON.stringify(body.value.snapshot)])
          await client.query('UPDATE correspondence_threads SET last_message_at=now(), updated_at=now() WHERE id=$1', [replyMatch[1]])
          return { id: inserted.rows[0].id, sentAt: new Date(inserted.rows[0].created_at).toISOString() }
        }, accountEmail)
        return reply ? response(201, reply) : response(404, { code: 'NOT_FOUND', message: 'Correspondence not found.' })
      }

      return response(404, { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' })
    } catch (error) {
      logger.error?.('Lumie API request failed', { error })
      return response(500, { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' })
    }
  }
}
