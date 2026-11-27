export interface VerifiedCognitoIdentity {
  sub: string
  issuer: string
  tokenUse: 'access' | 'id'
}

export interface LumieProfile {
  id: string
  displayName: string
  avatarAssetId: string | null
  locale: string
  timeZone: string
  createdAt: string
}

export interface ProfileProvisioningInput {
  cognitoSub: string
  displayName: string
}

export type AuthContractResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function boundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

/**
 * Accepts claims only after the API authorizer has verified the JWT signature,
 * issuer, audience/client and expiry. Never pass decoded, unverified browser claims.
 */
export function parseVerifiedCognitoIdentity(
  value: unknown,
  expectedIssuer: string,
): AuthContractResult<VerifiedCognitoIdentity> {
  if (!isRecord(value)) return { ok: false, reason: 'Verified identity must be an object.' }
  if (!boundedString(value.sub, 128)) return { ok: false, reason: 'Cognito subject is missing or invalid.' }
  if (value.iss !== expectedIssuer) return { ok: false, reason: 'Identity issuer is not trusted.' }
  if (value.token_use !== 'access' && value.token_use !== 'id') {
    return { ok: false, reason: 'Cognito token use is invalid.' }
  }

  return {
    ok: true,
    value: {
      sub: value.sub,
      issuer: expectedIssuer,
      tokenUse: value.token_use,
    },
  }
}

/** Builds profile input from trusted identity plus an optional user-editable name. */
export function createProfileProvisioningInput(
  identity: VerifiedCognitoIdentity,
  requestedDisplayName?: string,
): AuthContractResult<ProfileProvisioningInput> {
  const displayName = typeof requestedDisplayName === 'string'
    ? requestedDisplayName.trim().replace(/\\s+/g, ' ').slice(0, 80)
    : ''

  return {
    ok: true,
    value: {
      cognitoSub: identity.sub,
      displayName,
    },
  }
}

export function parseLumieProfile(value: unknown): AuthContractResult<LumieProfile> {
  if (!isRecord(value)) return { ok: false, reason: 'Profile response must be an object.' }
  if (!boundedString(value.id, 64)) return { ok: false, reason: 'Profile ID is invalid.' }
  if (typeof value.displayName !== 'string' || value.displayName.length > 80) {
    return { ok: false, reason: 'Profile display name is invalid.' }
  }
  if (value.avatarAssetId !== null && typeof value.avatarAssetId !== 'string') {
    return { ok: false, reason: 'Profile avatar asset ID is invalid.' }
  }
  if (!boundedString(value.locale, 35) || !boundedString(value.timeZone, 64)) {
    return { ok: false, reason: 'Profile locale or time zone is invalid.' }
  }
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) {
    return { ok: false, reason: 'Profile creation timestamp is invalid.' }
  }

  return {
    ok: true,
    value: {
      id: value.id,
      displayName: value.displayName,
      avatarAssetId: value.avatarAssetId,
      locale: value.locale,
      timeZone: value.timeZone,
      createdAt: value.createdAt,
    },
  }
}
