import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { createDb, DRIZZLE, openSqlite, SQLITE, type SqliteConnection } from './database.js';

@Global()
@Module({
  providers: [
    {
      provide: SQLITE,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => openSqlite(config.databasePath),
    },
    {
      provide: DRIZZLE,
      inject: [SQLITE],
      useFactory: (sqlite: SqliteConnection) => createDb(sqlite),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(SQLITE) private readonly sqlite: SqliteConnection) {}

  onApplicationShutdown(): void {
    if (this.sqlite.open) this.sqlite.close();
  }
}
