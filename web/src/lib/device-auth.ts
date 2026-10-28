import crypto from "crypto";

/**
 * Validates the device authorization header or token against the configured server secret.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyDeviceAuth(authHeader: string | null | undefined): boolean {
  const secret = process.env.DEVICE_API_TOKEN;

  if (!secret || secret.trim().length === 0) {
    // If no secret is configured on the server, deny access by default for safety
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Extract Bearer token if provided as "Bearer <token>"
  let token = authHeader.trim();
  if (token.toLowerCase().startsWith("bearer ")) {
    token = token.slice(7).trim();
  }

  if (!token) {
    return false;
  }

  try {
    const tokenBuffer = Buffer.from(token);
    const secretBuffer = Buffer.from(secret);

    // If lengths differ, compare against self to maintain constant time, then return false
    if (tokenBuffer.length !== secretBuffer.length) {
      crypto.timingSafeEqual(tokenBuffer, tokenBuffer);
      return false;
    }

    return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
  } catch {
    return false;
  }
}
