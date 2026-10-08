/**
 * Prints an ADMIN_PASSWORD_HASH value for the given password.
 * Interactive: pnpm --filter @team-radar/api hash-password
 * Piped:       printf '%s' "$PASSWORD" | node dist/scripts/hash-password.js
 */
import { text } from 'node:stream/consumers';
import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../auth/password.js';

const MIN_LENGTH = 10;

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) return (await text(process.stdin)).replace(/\r?\n$/, '');
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    return await rl.question('Password: ');
  } finally {
    rl.close();
  }
}

const password = await readPassword();
if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
console.log(await hashPassword(password));
