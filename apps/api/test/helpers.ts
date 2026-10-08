import { type NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

export const TEST_PASSWORD = 'correct horse battery staple';

/** Boots the full application on a fresh in-memory database. */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app);
  await app.init();
  return app;
}

/** A supertest agent that carries the session cookie after logging in. */
export async function loggedInAgent(app: NestExpressApplication) {
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/auth/login').send({ password: TEST_PASSWORD }).expect(204);
  return agent;
}
