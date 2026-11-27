import { createServer } from 'node:http'
import { createRemoteJWKSet } from 'jose'
import pg from 'pg'
import { createApiHandler } from './api.mjs'
import { createLocalTokenVerifier } from './local-auth.mjs'

const { Pool } = pg
const port = Number.parseInt(process.env.PORT || '3001', 10)
const issuer = process.env.LOCAL_OIDC_ISSUER
const jwksUrl = process.env.LOCAL_OIDC_JWKS_URL
const clientId = process.env.LOCAL_OIDC_CLIENT_ID
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

if (!process.env.DATABASE_URL || !issuer || !jwksUrl || !clientId) {
  throw new Error('DATABASE_URL, LOCAL_OIDC_ISSUER, LOCAL_OIDC_JWKS_URL and LOCAL_OIDC_CLIENT_ID are required.')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
})
const keySet = createRemoteJWKSet(new URL(jwksUrl))
const verifyAccessToken = createLocalTokenVerifier({
  issuer,
  clientId,
  getKey: keySet,
})
const apiHandler = createApiHandler({ pool })

function sendJson(response, statusCode, value, corsHeaders) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

function corsFor(request) {
  const origin = request.headers.origin
  if (origin !== corsOrigin) return {}
  return {
    'access-control-allow-origin': corsOrigin,
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Authorization,Content-Type',
    'access-control-max-age': '600',
    vary: 'Origin',
  }
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1_048_576) throw Object.assign(new Error('Request body too large.'), { statusCode: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export function createLocalServer() {
  return createServer(async (request, response) => {
    const corsHeaders = corsFor(request)
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }

    const url = new URL(request.url || '/', 'http://localhost')
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'lumie-local-api' }, corsHeaders)
      return
    }

    if (request.headers.origin && request.headers.origin !== corsOrigin) {
      sendJson(response, 403, { code: 'ORIGIN_NOT_ALLOWED', message: 'This origin is not allowed.' }, corsHeaders)
      return
    }

    const authorization = request.headers.authorization || ''
    const match = authorization.match(/^Bearer (.+)$/i)
    if (!match) {
      sendJson(response, 401, { code: 'UNAUTHORIZED', message: 'Sign in to continue.' }, corsHeaders)
      return
    }

    let claims
    try {
      claims = await verifyAccessToken(match[1])
    } catch {
      sendJson(response, 401, { code: 'UNAUTHORIZED', message: 'Sign in to continue.' }, corsHeaders)
      return
    }

    let body
    try {
      body = await readBody(request)
    } catch (error) {
      sendJson(response, error.statusCode || 400, {
        code: error.statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_BODY',
        message: error.statusCode === 413 ? 'The request is too large.' : 'The request body could not be read.',
      }, corsHeaders)
      return
    }

    const queryStringParameters = Object.fromEntries(url.searchParams.entries())
    const result = await apiHandler({
      version: '2.0',
      rawPath: url.pathname,
      rawQueryString: url.search.slice(1),
      headers: { 'content-type': request.headers['content-type'] || '' },
      queryStringParameters,
      body: body || undefined,
      isBase64Encoded: false,
      requestContext: {
        http: { method: request.method, path: url.pathname },
        authorizer: { jwt: { claims } },
      },
    })

    response.writeHead(result.statusCode, { ...corsHeaders, ...result.headers })
    response.end(result.body || '')
  })
}

const server = createLocalServer()
server.listen(port, '0.0.0.0', () => {
  process.stdout.write(`Lumie local API listening on http://localhost:${port}\n`)
})

async function shutdown() {
  server.close()
  await pool.end()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
