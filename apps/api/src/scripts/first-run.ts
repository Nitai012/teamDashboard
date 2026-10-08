/**
 * Interactive first-time setup for running locally: asks for a login
 * password, writes .env at the repository root (password hash, session
 * secret, web build path) and optionally loads a sample team.
 *
 * Usage: pnpm first-run
 * Prompts are in English because most terminals do not render Hebrew
 * right-to-left.
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { text } from 'node:stream/consumers';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../auth/password.js';

const ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const API_DIR = fileURLToPath(new URL('../../', import.meta.url));
const ENV_PATH = `${ROOT}.env`;
const EXAMPLE_PATH = `${ROOT}.env.example`;
const MIN_PASSWORD = 10;

/** Answers piped on stdin (for scripted runs), consumed one line at a time. */
let pipedLines: string[] | null = null;

async function nextPipedLine(): Promise<string> {
  pipedLines ??= (await text(process.stdin)).split(/\r?\n/);
  return pipedLines.shift() ?? '';
}

/** Reads a line without echoing it to the terminal. */
async function askHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) return nextPipedLine();
  process.stderr.write(question);
  const { stdin } = process;
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  stdin.resume();
  return new Promise((resolve) => {
    let value = '';
    const done = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stderr.write('\n');
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          done();
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          done();
          process.exit(130);
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function askYesNo(question: string, defaultYes: boolean): Promise<boolean> {
  const hint = defaultYes ? '[Y/n]' : '[y/N]';
  let answer: string;
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    answer = await rl.question(`${question} ${hint} `);
    rl.close();
  } else {
    answer = await nextPipedLine();
  }
  const normalized = answer.trim().toLowerCase();
  return normalized === '' ? defaultYes : normalized.startsWith('y');
}

async function choosePassword(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const password = await askHidden(
      `Choose a login password (at least ${MIN_PASSWORD} characters): `,
    );
    if (password.length < MIN_PASSWORD) {
      console.error(`Too short. Use at least ${MIN_PASSWORD} characters.`);
      continue;
    }
    if ((await askHidden('Type it again: ')) !== password) {
      console.error('The passwords did not match. Try again.');
      continue;
    }
    return password;
  }
  console.error('Setup stopped. Run "pnpm first-run" to try again.');
  process.exit(1);
}

function readValue(content: string, key: string): string {
  return new RegExp(`^${key}=(.*)$`, 'm').exec(content)?.[1]?.trim() ?? '';
}

function setValue(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, 'm');
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
}

async function main(): Promise<void> {
  console.log('\nTeam radar: first-time setup\n');

  let content = existsSync(ENV_PATH)
    ? readFileSync(ENV_PATH, 'utf8')
    : readFileSync(EXAMPLE_PATH, 'utf8');
  const configured = Boolean(readValue(content, 'ADMIN_PASSWORD_HASH'));

  if (!configured || (await askYesNo('A password is already set. Choose a new one?', false))) {
    const password = await choosePassword();
    content = setValue(content, 'ADMIN_PASSWORD_HASH', await hashPassword(password));
  }
  if (!readValue(content, 'SESSION_SECRET')) {
    content = setValue(content, 'SESSION_SECRET', randomBytes(48).toString('base64url'));
  }
  if (!readValue(content, 'WEB_DIST_PATH')) {
    content = setValue(content, 'WEB_DIST_PATH', '../web/dist');
  }
  writeFileSync(ENV_PATH, content, { mode: 0o600 });
  console.log('Saved settings to .env (this file stays on your computer and is not committed).');

  if (await askYesNo('Add a sample team so you can see how it looks?', true)) {
    const seed = spawnSync(process.execPath, ['dist/database/seed.js'], {
      cwd: API_DIR,
      stdio: 'inherit',
    });
    if (seed.status !== 0) process.exit(seed.status ?? 1);
  }

  console.log('\nDone. Next:');
  console.log('  pnpm dev     then open http://localhost:5173');
  console.log('  pnpm serve   to run it as one server on port 3000 (reachable from your phone)\n');
}

await main();
