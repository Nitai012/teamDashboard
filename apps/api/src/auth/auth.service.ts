import { Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { AppConfig } from '../config/app-config.js';
import { verifyPassword } from './password.js';

export const SESSION_COOKIE = 'tr_session';
const SESSION_VERSION = 'v1';

/**
 * Single-user session handling. The session is a signed cookie (cookie-parser
 * HMAC with SESSION_SECRET) holding only its expiry time; it is httpOnly and
 * SameSite=Strict, which also protects the JSON API from cross-site requests.
 */
@Injectable()
export class AuthService {
  constructor(private readonly config: AppConfig) {}

  verifyPassword(password: string): Promise<boolean> {
    return verifyPassword(password, this.config.adminPasswordHash);
  }

  startSession(res: Response): void {
    const expiresAt = Date.now() + this.config.sessionTtlMs;
    res.cookie(SESSION_COOKIE, `${SESSION_VERSION}.${expiresAt}`, {
      ...this.cookieOptions(),
      maxAge: this.config.sessionTtlMs,
      signed: true,
    });
  }

  endSession(res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  hasValidSession(req: Request): boolean {
    const value: unknown = req.signedCookies?.[SESSION_COOKIE];
    if (typeof value !== 'string') return false;
    const [version, expiresAt] = value.split('.');
    return version === SESSION_VERSION && Number(expiresAt) > Date.now();
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'strict',
      secure: this.config.cookieSecure,
      path: '/',
    };
  }
}
