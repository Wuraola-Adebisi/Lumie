import { jwtVerify } from 'jose'

/**
 * Verify a local identity-provider access token before adapting its claims to
 * the API Gateway authorizer event shape. Never pass browser-decoded claims.
 */
export function createLocalTokenVerifier({ issuer, clientId, getKey }) {
  if (!issuer || !clientId || typeof getKey !== 'function') {
    throw new TypeError('issuer, clientId and a signing-key resolver are required.')
  }

  return async function verifyAccessToken(token) {
    if (typeof token !== 'string' || token.length > 16_384) {
      throw new Error('Invalid access token.')
    }

    const { payload } = await jwtVerify(token, getKey, {
      issuer,
      algorithms: ['RS256'],
      clockTolerance: 5,
    })

    if (payload.token_use !== 'access' || payload.azp !== clientId ||
      typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('The token is not a Lumie local access token.')
    }

    return {
      sub: payload.sub,
      iss: payload.iss,
      token_use: payload.token_use,
      ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
    }
  }
}
