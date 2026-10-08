import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { type BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

export type Db = BetterSQLite3Database<typeof schema>;
/** Either the database or an open transaction on it. */
export type DbExecutor = Db | Parameters<Parameters<Db['transaction']>[0]>[0];
export type SqliteConnection = Database.Database;

/** Injection tokens. */
export const SQLITE = Symbol('SQLITE');
export const DRIZZLE = Symbol('DRIZZLE');

/** Resolves to apps/api/drizzle from both src/ (tests) and dist/ (runtime). */
const MIGRATIONS_DIR = fileURLToPath(new URL('../../drizzle', import.meta.url));

export function openSqlite(path: string): SqliteConnection {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  return sqlite;
}

/** Wraps a connection with Drizzle and brings the schema up to date. */
export function createDb(sqlite: SqliteConnection): Db {
  const db = drizzle({ client: sqlite, schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db;
}
