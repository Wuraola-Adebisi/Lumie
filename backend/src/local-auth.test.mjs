import { describe, expect, it } from 'vitest'
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

describe('local access-token verification', () => {
  it('returns only trusted identity claims from a signed access token', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    const claims = await verify(await createToken(privateKey))

    expect(claims).toEqual({
      sub: 'local-user-123',
      iss: issuer,
      token_use: 'access',
    })
  })

  it('rejects a token minted for another client', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    await expect(verify(await createToken(privateKey, { azp: 'another-client' }))).rejects.toThrow()
  })

  it('rejects an ID token', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => publicKey,
    })
    await expect(verify(await createToken(privateKey, { token_use: 'id' }))).rejects.toThrow()
  })

  it('rejects a token from another issuer', async () => {
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

    await expect(verify(token)).rejects.toThrow()
  })

  it('rejects a token with an invalid signature', async () => {
    const first = await generateKeyPair('RS256')
    const second = await generateKeyPair('RS256')
    const verify = createLocalTokenVerifier({
      issuer,
      clientId,
      getKey: async () => first.publicKey,
    })
    await expect(verify(await createToken(second.privateKey))).rejects.toThrow()
  })
})
