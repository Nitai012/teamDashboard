import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type SkillDto } from '@team-radar/shared';
import { and, asc, eq } from 'drizzle-orm';
import { newId, nowIso } from '../common/time.js';
import { type Db, type DbExecutor, DRIZZLE } from '../database/database.js';
import { memberSkills, skills, type SkillRow } from '../database/schema.js';
import { displayName, skillKey } from './skill-key.js';

function toSkillDto(row: SkillRow): SkillDto {
  return { id: row.id, name: row.name };
}

@Injectable()
export class SkillsService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  list(): SkillDto[] {
    return this.db.select().from(skills).orderBy(asc(skills.createdAt)).all().map(toSkillDto);
  }

  create(name: string): SkillDto {
    if (this.findByName(this.db, name))
      throw new ConflictException('A skill with this name exists');
    return toSkillDto(this.insert(this.db, name));
  }

  /** Returns the id of the skill with this name, creating it when missing. */
  ensure(tx: DbExecutor, name: string): string {
    return (this.findByName(tx, name) ?? this.insert(tx, name)).id;
  }

  /**
   * Renames a skill. Renaming to the name of another skill merges the two:
   * each soldier keeps the higher level, and training flags are combined.
   */
  rename(id: string, name: string): SkillDto {
    const source = this.findRow(id);
    const target = this.findByName(this.db, name);

    if (!target || target.id === source.id) {
      this.db
        .update(skills)
        .set({ name: displayName(name), nameKey: skillKey(name) })
        .where(eq(skills.id, id))
        .run();
      return toSkillDto(this.findRow(id));
    }

    this.db.transaction((tx) => {
      const sourceRows = tx
        .select()
        .from(memberSkills)
        .where(eq(memberSkills.skillId, source.id))
        .all();
      for (const row of sourceRows) {
        const existing = tx
          .select()
          .from(memberSkills)
          .where(and(eq(memberSkills.memberId, row.memberId), eq(memberSkills.skillId, target.id)))
          .get();
        const level = Math.max(row.level, existing?.level ?? 0);
        const inTraining = row.inTraining || (existing?.inTraining ?? false);
        tx.insert(memberSkills)
          .values({ memberId: row.memberId, skillId: target.id, level, inTraining })
          .onConflictDoUpdate({
            target: [memberSkills.memberId, memberSkills.skillId],
            set: { level, inTraining },
          })
          .run();
      }
      tx.delete(skills).where(eq(skills.id, source.id)).run();
    });
    return toSkillDto(target);
  }

  remove(id: string): void {
    this.findRow(id);
    this.db.delete(skills).where(eq(skills.id, id)).run();
  }

  private findRow(id: string): SkillRow {
    const row = this.db.select().from(skills).where(eq(skills.id, id)).get();
    if (!row) throw new NotFoundException('Skill not found');
    return row;
  }

  private findByName(tx: DbExecutor, name: string): SkillRow | undefined {
    return tx
      .select()
      .from(skills)
      .where(eq(skills.nameKey, skillKey(name)))
      .get();
  }

  private insert(tx: DbExecutor, name: string): SkillRow {
    const row: SkillRow = {
      id: newId(),
      name: displayName(name),
      nameKey: skillKey(name),
      createdAt: nowIso(),
    };
    tx.insert(skills).values(row).run();
    return row;
  }
}
