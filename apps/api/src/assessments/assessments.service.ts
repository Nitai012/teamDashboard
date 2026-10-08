import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type AssessmentDto, type AssessmentInputData } from '@team-radar/shared';
import { asc, eq } from 'drizzle-orm';
import { newId, nowIso } from '../common/time.js';
import { type Db, DRIZZLE } from '../database/database.js';
import { type AssessmentRow, assessments } from '../database/schema.js';
import { MembersService } from '../members/members.service.js';

export function toAssessmentDto(row: AssessmentRow): AssessmentDto {
  return {
    id: row.id,
    memberId: row.memberId,
    date: row.date,
    scores: row.scores,
    goal: row.goal,
    personalAxis: row.personalAxis,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class AssessmentsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly members: MembersService,
  ) {}

  list(memberId?: string): AssessmentDto[] {
    const query = this.db.select().from(assessments);
    const rows = memberId
      ? query.where(eq(assessments.memberId, memberId)).orderBy(asc(assessments.date)).all()
      : query.orderBy(asc(assessments.date)).all();
    return rows.map(toAssessmentDto);
  }

  /** One placement per soldier per day: saving again on the same date updates it. */
  upsert(memberId: string, date: string, input: AssessmentInputData): AssessmentDto {
    const member = this.members.findRow(memberId);
    const now = nowIso();
    const row = this.db
      .insert(assessments)
      .values({
        id: newId(),
        memberId,
        date,
        scores: input.scores,
        goal: input.goal,
        personalAxis: member.personalAxis,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [assessments.memberId, assessments.date],
        set: {
          scores: input.scores,
          goal: input.goal,
          personalAxis: member.personalAxis,
          updatedAt: now,
        },
      })
      .returning()
      .get();
    return toAssessmentDto(row);
  }

  remove(id: string): void {
    const result = this.db.delete(assessments).where(eq(assessments.id, id)).run();
    if (result.changes === 0) throw new NotFoundException('Assessment not found');
  }
}
