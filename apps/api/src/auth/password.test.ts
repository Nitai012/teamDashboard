import { describe, expect, it } from 'vitest';
import { hashPassword, PASSWORD_HASH_PREFIX, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies the original password only', async () => {
    const hash = await hashPassword('a long passphrase');
    expect(hash.startsWith(PASSWORD_HASH_PREFIX)).toBe(true);
    expect(hash).not.toContain('$');
    await expect(verifyPassword('a long passphrase', hash)).resolves.toBe(true);
    await expect(verifyPassword('a long passphras', hash)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  it('rejects malformed stored values', async () => {
    await expect(verifyPassword('x', 'plain-text')).resolves.toBe(false);
    await expect(verifyPassword('x', 'scrypt:1:2:3:abc:short')).resolves.toBe(false);
  });
});
