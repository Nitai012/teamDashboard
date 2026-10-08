import 'reflect-metadata';
import './load-env.js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { AppConfig } from './config/app-config.js';
import { configureApp } from './configure-app.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app);

  const config = app.get(AppConfig);
  await app.listen(config.port, config.host);
  Logger.log(`Listening on http://${config.host}:${config.port}`, 'Bootstrap');
}

await bootstrap();
