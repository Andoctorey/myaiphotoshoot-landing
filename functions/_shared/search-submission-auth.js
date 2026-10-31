/**
 * @param {Request} request
 * @param {string} expectedToken
 * @returns {Promise<boolean>}
 */
export async function hasValidBearerToken(request, expectedToken) {
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) {
    return false;
  }

  const providedToken = authorization.slice('Bearer '.length);
  if (!providedToken) {
    return false;
  }

  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(providedToken)),
    crypto.subtle.digest('SHA-256', encoder.encode(expectedToken))
  ]);
  const providedBytes = new Uint8Array(providedHash);
  const expectedBytes = new Uint8Array(expectedHash);
  let difference = 0;

  for (let i = 0; i < providedBytes.length; i++) {
    difference |= providedBytes[i] ^ expectedBytes[i];
  }

  return difference === 0;
}
