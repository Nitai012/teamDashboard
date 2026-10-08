import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  type MemberDto,
  type MemberInputData,
  type MemberSkillDto,
  type MemberSkillInput,
  type MemberUpdateInput,
  type SkillLevel,
} from '@team-radar/shared';
import { and, asc, eq } from 'drizzle-orm';
import { newId, nowIso } from '../common/time.js';
import { type Db, DRIZZLE } from '../database/database.js';
import {
  memberSkills,
  members,
  type MemberRow,
  type MemberSkillRow,
  skills,
} from '../database/schema.js';

function toSkillDto(row: MemberSkillRow): MemberSkillDto {
  return { skillId: row.skillId, level: row.level as SkillLevel, inTraining: row.inTraining };
}

export function toMemberDto(row: MemberRow, skillRows: MemberSkillRow[]): MemberDto {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    startDate: row.startDate,
    releaseDate: row.releaseDate,
    notes: row.notes,
    personalAxis: row.personalAxis,
    isExample: row.isExample,
    skills: skillRows.map(toSkillDto),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class MembersService {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  list(): MemberDto[] {
    const rows = this.db.select().from(members).orderBy(asc(members.createdAt)).all();
    const bySkillOwner = new Map<string, MemberSkillRow[]>();
    for (const row of this.db.select().from(memberSkills).all()) {
      const list = bySkillOwner.get(row.memberId) ?? [];
      list.push(row);
      bySkillOwner.set(row.memberId, list);
    }
    return rows.map((row) => toMemberDto(row, bySkillOwner.get(row.id) ?? []));
  }

  get(id: string): MemberDto {
    const row = this.findRow(id);
    const skillRows = this.db
      .select()
      .from(memberSkills)
      .where(eq(memberSkills.memberId, id))
      .all();
    return toMemberDto(row, skillRows);
  }

  findRow(id: string): MemberRow {
    const row = this.db.select().from(members).where(eq(members.id, id)).get();
    if (!row) throw new NotFoundException('Member not found');
    return row;
  }

  create(input: MemberInputData): MemberDto {
    const now = nowIso();
    const id = newId();
    this.db
      .insert(members)
      .values({ id, ...input, isExample: false, createdAt: now, updatedAt: now })
      .run();
    return this.get(id);
  }

  update(id: string, input: MemberUpdateInput): MemberDto {
    this.findRow(id);
    this.db
      .update(members)
      .set({ ...input, updatedAt: nowIso() })
      .where(eq(members.id, id))
      .run();
    return this.get(id);
  }

  remove(id: string): void {
    this.findRow(id);
    this.db.delete(members).where(eq(members.id, id)).run();
  }

  removeExamples(): number {
    return this.db.delete(members).where(eq(members.isExample, true)).run().changes;
  }

  /** Sets a level and training flag; level 0 without training removes the entry. */
  setSkill(memberId: string, skillId: string, input: MemberSkillInput): MemberDto {
    this.findRow(memberId);
    if (!this.db.select({ id: skills.id }).from(skills).where(eq(skills.id, skillId)).get()) {
      throw new NotFoundException('Skill not found');
    }

    this.db.transaction((tx) => {
      if (input.level === 0 && !input.inTraining) {
        tx.delete(memberSkills)
          .where(and(eq(memberSkills.memberId, memberId), eq(memberSkills.skillId, skillId)))
          .run();
      } else {
        tx.insert(memberSkills)
          .values({ memberId, skillId, level: input.level, inTraining: input.inTraining })
          .onConflictDoUpdate({
            target: [memberSkills.memberId, memberSkills.skillId],
            set: { level: input.level, inTraining: input.inTraining },
          })
          .run();
      }
      tx.update(members).set({ updatedAt: nowIso() }).where(eq(members.id, memberId)).run();
    });

    return this.get(memberId);
  }
}
