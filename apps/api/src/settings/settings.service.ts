import { Inject, Injectable } from '@nestjs/common';
import { axesSchema, DEFAULT_AXES, type SettingsDto } from '@team-radar/shared';
import { eq } from 'drizzle-orm';
import { type Db, type DbExecutor, DRIZZLE } from '../database/database.js';
import { settings } from '../database/schema.js';

const AXES_KEY = 'axes';

@Injectable()
export class SettingsService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  get(): SettingsDto {
    return { axes: this.getAxes() };
  }

  getAxes(): string[] {
    const row = this.db.select().from(settings).where(eq(settings.key, AXES_KEY)).get();
    const parsed = axesSchema.safeParse(row?.value);
    return parsed.success ? parsed.data : [...DEFAULT_AXES];
  }

  setAxes(axes: string[], executor: DbExecutor = this.db): SettingsDto {
    executor
      .insert(settings)
      .values({ key: AXES_KEY, value: axes })
      .onConflictDoUpdate({ target: settings.key, set: { value: axes } })
      .run();
    return this.get();
  }
}
