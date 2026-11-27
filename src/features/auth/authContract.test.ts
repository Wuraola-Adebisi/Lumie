import { describe, expect, it } from 'vitest'
import {
  createProfileProvisioningInput,
  parseLumieProfile,
  parseVerifiedCognitoIdentity,
} from './authContract'

const issuer = 'https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_example'

describe('parseVerifiedCognitoIdentity', () => {
  it('accepts a verified Cognito subject from the configured issuer', () => {
    expect(parseVerifiedCognitoIdentity({
      sub: 'cognito-user-123',
      iss: issuer,
      token_use: 'access',
    }, issuer)).toEqual({
      ok: true,
      value: { sub: 'cognito-user-123', issuer, tokenUse: 'access' },
    })
  })

  it('rejects missing subjects, untrusted issuers and unsupported token types', () => {
    expect(parseVerifiedCognitoIdentity({ iss: issuer, token_use: 'access' }, issuer).ok).toBe(false)
    expect(parseVerifiedCognitoIdentity({
      sub: 'user-1', iss: 'https://attacker.invalid', token_use: 'access',
    }, issuer).ok).toBe(false)
    expect(parseVerifiedCognitoIdentity({
      sub: 'user-1', iss: issuer, token_use: 'refresh',
    }, issuer).ok).toBe(false)
  })
})

describe('createProfileProvisioningInput', () => {
  it('uses the trusted subject and normalises the optional display name', () => {
    const identity = { sub: 'trusted-sub', issuer, tokenUse: 'id' as const }
    expect(createProfileProvisioningInput(identity, '  Wuraola   Adebisi  ')).toEqual({
      ok: true,
      value: { cognitoSub: 'trusted-sub', displayName: 'Wuraola Adebisi' },
    })
  })

  it('never accepts an owner ID from profile input', () => {
    const identity = { sub: 'trusted-sub', issuer, tokenUse: 'access' as const }
    const result = createProfileProvisioningInput(identity, 'Writer')
    expect(result.ok && result.value).toEqual({
      cognitoSub: 'trusted-sub',
      displayName: 'Writer',
    })
    expect(result.ok && 'ownerId' in result.value).toBe(false)
  })
})

describe('parseLumieProfile', () => {
  it('accepts the public profile contract without exposing the Cognito subject', () => {
    expect(parseLumieProfile({
      id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21',
      displayName: 'Writer',
      avatarAssetId: null,
      locale: 'en',
      timeZone: 'Africa/Lagos',
      createdAt: '2026-11-27T10:00:00.000Z',
    }).ok).toBe(true)
  })

  it('rejects invalid or overlong profile fields', () => {
    expect(parseLumieProfile({
      id: 'profile-1',
      displayName: 'x'.repeat(81),
      avatarAssetId: null,
      locale: 'en',
      timeZone: 'UTC',
      createdAt: '2026-11-27T10:00:00.000Z',
    }).ok).toBe(false)
  })
})
