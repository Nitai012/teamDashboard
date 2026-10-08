import { type NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, TEST_PASSWORD } from './helpers.js';

describe('auth', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the health check without a session', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200, { status: 'ok' });
  });

  it('rejects data requests without a session', async () => {
    await request(app.getHttpServer()).get('/api/members').expect(401);
    await request(app.getHttpServer()).get('/api/auth/session').expect(401);
  });

  it('rejects a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password: 'wrong password' })
      .expect(401);
  });

  it('issues an httpOnly, SameSite=Strict session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ password: TEST_PASSWORD })
      .expect(204);
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^tr_session=s%3A/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('ignores a tampered cookie', async () => {
    await request(app.getHttpServer())
      .get('/api/members')
      .set('Cookie', 'tr_session=v1.99999999999999')
      .expect(401);
  });

  it('ends the session on logout', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').send({ password: TEST_PASSWORD }).expect(204);
    await agent.get('/api/auth/session').expect(200, { authenticated: true });
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/session').expect(401);
  });

  it('throttles repeated login attempts', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 5; i++) {
      await request(server).post('/api/auth/login').send({ password: 'nope' }).expect(401);
    }
    await request(server).post('/api/auth/login').send({ password: TEST_PASSWORD }).expect(429);
  });

  it('sets security headers', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
