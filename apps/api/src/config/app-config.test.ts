import { isAbsolute } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AppConfig } from './app-config.js';

const valid = {
  SESSION_SECRET: 'x'.repeat(32),
  ADMIN_PASSWORD_HASH: 'scrypt:16384:8:1:salt:hash',
};

describe('AppConfig', () => {
  it('applies defaults', () => {
    const config = AppConfig.fromEnv(valid);
    expect(config).toMatchObject({ port: 3000, env: 'development', cookieSecure: false });
    expect(config.webDistPath).toBeUndefined();
  });

  it('resolves a relative web build path to an absolute one', () => {
    const config = AppConfig.fromEnv({ ...valid, WEB_DIST_PATH: '../web/dist' });
    expect(isAbsolute(config.webDistPath ?? '')).toBe(true);
  });

  it('defaults to secure cookies in production', () => {
    expect(AppConfig.fromEnv({ ...valid, NODE_ENV: 'production' }).cookieSecure).toBe(true);
    expect(
      AppConfig.fromEnv({ ...valid, NODE_ENV: 'production', COOKIE_SECURE: 'false' }).cookieSecure,
    ).toBe(false);
  });

  it('names every missing or invalid variable', () => {
    expect(() => AppConfig.fromEnv({ SESSION_SECRET: 'short' })).toThrow(
      /SESSION_SECRET[\s\S]*ADMIN_PASSWORD_HASH/,
    );
  });
});
