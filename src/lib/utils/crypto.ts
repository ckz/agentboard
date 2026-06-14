import { createHash, randomBytes } from "crypto";

const TOKEN_PREFIX = process.env.TOKEN_PREFIX || "ab_";
const TOKEN_LENGTH = 48;

/**
 * Generate a new API token.
 * Returns the raw token (shown once to user) and its SHA-256 hash (stored in DB).
 */
export function generateToken(): { raw: string; hash: string; prefix: string } {
  const randomPart = randomBytes(TOKEN_LENGTH)
    .toString("base64url")
    .slice(0, TOKEN_LENGTH);
  const raw = `${TOKEN_PREFIX}${randomPart}`;
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, TOKEN_PREFIX.length + 8);
  return { raw, hash, prefix };
}

/**
 * Hash a raw token for lookup.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
