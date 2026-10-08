import { randomBytes, scrypt, type ScryptOptions, timingSafeEqual } from 'node:crypto';

/**
 * Password hashes are stored as `scrypt:N:r:p:salt:hash` (base64url parts).
 * Colons keep the value safe in .env files and docker compose, where `$` would
 * be interpolated.
 */
export const PASSWORD_HASH_PREFIX = 'scrypt:';

const PARAMS = { N: 16_384, r: 8, p: 1 } as const;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join(':');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltPart, keyPart] = stored.split(':');
  if (scheme !== 'scrypt' || !n || !r || !p || !saltPart || !keyPart) return false;

  const expected = Buffer.from(keyPart, 'base64url');
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await derive(password, Buffer.from(saltPart, 'base64url'), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected);
}
