import { existsSync } from 'node:fs';

/**
 * Loads environment variables from a local file when one exists. Looks for
 * ENV_FILE, then .env in the working directory, then the repository root (the
 * API runs from apps/api during development). Deployments that pass variables
 * directly, like docker compose, need no file.
 */
const candidates = [process.env.ENV_FILE, '.env', '../../.env'].filter((path): path is string =>
  Boolean(path),
);
const file = candidates.find((path) => existsSync(path));

if (file) process.loadEnvFile(file);
