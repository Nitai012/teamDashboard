import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from '../auth/public.decorator.js';
import { type Db, DRIZZLE } from '../database/database.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  @Public()
  @Get()
  check(): { status: 'ok' } {
    this.db.get(sql`select 1`);
    return { status: 'ok' };
  }
}
