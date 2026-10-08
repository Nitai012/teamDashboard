import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SessionGuard } from './auth/session.guard.js';
import { BackupModule } from './backup/backup.module.js';
import { AppConfig } from './config/app-config.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health/health.controller.js';
import { MembersModule } from './members/members.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { SkillsModule } from './skills/skills.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 600 }]),
    // In production the API also serves the built web app from the same origin.
    ServeStaticModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        if (!config.webDistPath) return [];
        if (!existsSync(join(config.webDistPath, 'index.html'))) {
          // Normal during development, before the web app has been built.
          new Logger('Static').warn(`No web build at ${config.webDistPath}; serving the API only`);
          return [];
        }
        return [{ rootPath: config.webDistPath, exclude: ['/api/{*path}'] }];
      },
    }),
    AuthModule,
    MembersModule,
    SkillsModule,
    AssessmentsModule,
    SettingsModule,
    BackupModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
