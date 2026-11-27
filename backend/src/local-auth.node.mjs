import test from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair, SignJWT } from 'jose'
import { createLocalTokenVerifier } from './local-auth.mjs'

const issuer = 'http://localhost:8080/realms/lumie'
const clientId = 'lumie-local'

async function createToken(privateKey, overrides = {}) {
  return new SignJWT({
    token_use: 'access',
    azp: clientId,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(issuer)
    .setSubject('local-user-123')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey)
}

test('local access-token verification', async (t) => {
  await t.test('returns only trusted identity claims from a signed access token', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    const claims = await verify(await createToken(privateKey))

    assert.deepEqual(claims, {
      sub: 'local-user-123',
      iss: issuer,
      token_use: 'access',
    })
  })


  await t.test('passes through an email only after token signature verification', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    const claims = await verify(await createToken(privateKey, { email: 'person@example.com' }))
    assert.equal(claims.email, 'person@example.com')
  })

  await t.test('rejects a token minted for another client', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    await assert.rejects(verify(await createToken(privateKey, { azp: 'another-client' })))
  })

  await t.test('rejects an ID token', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    await assert.rejects(verify(await createToken(privateKey, { token_use: 'id' })))
  })

  await t.test('rejects a token from another issuer', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    const token = await new SignJWT({ token_use: 'access', azp: clientId })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer('https://attacker.invalid')
      .setSubject('local-user-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)

    await assert.rejects(verify(token))
  })

  await t.test('rejects a token with an invalid signature', async () => {
    const first = await generateKeyPair('RS256')
    const second = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => first.publicKey,
    })
    await assert.rejects(verify(await createToken(second.privateKey)))
  })
})
