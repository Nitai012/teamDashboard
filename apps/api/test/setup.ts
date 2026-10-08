import 'reflect-metadata';
import { hashPassword } from '../src/auth/password.js';
import { TEST_PASSWORD } from './helpers.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough-123';
process.env.ADMIN_PASSWORD_HASH = await hashPassword(TEST_PASSWORD);
delete process.env.WEB_DIST_PATH;
