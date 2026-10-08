import { Inject, Injectable } from '@nestjs/common';
import {
  average,
  AXIS_COUNT,
  type Backup,
  type ImportResultDto,
  isIsoDate,
  normalizeScores,
  PERSONAL_AXIS_INDEX,
  SKILL_LEVELS,
} from '@team-radar/shared';
import { eq } from 'drizzle-orm';
import { AssessmentsService } from '../assessments/assessments.service.js';
import { newId, nowIso } from '../common/time.js';
import { type Db, DRIZZLE } from '../database/database.js';
import { assessments, memberSkills, members } from '../database/schema.js';
import { MembersService } from '../members/members.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { toCsv } from './csv.js';

export const BACKUP_VERSION = 3;

const clampLevel = (n: number) => Math.min(3, Math.max(0, Math.round(n)));
const validDate = (value: string | null | undefined) => (isIsoDate(value) ? value : null);

@Injectable()
export class BackupService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Db,
    private readonly members: MembersService,
    private readonly skills: SkillsService,
    private readonly assessments: AssessmentsService,
    private readonly settings: SettingsService,
  ) {}

  export() {
    const skillNames = new Map(this.skills.list().map((s) => [s.id, s.name]));
    return {
      app: 'team-radar',
      version: BACKUP_VERSION,
      exportedAt: nowIso(),
      axes: this.settings.getAxes(),
      skills: [...skillNames.values()],
      members: this.members.list().map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        startDate: m.startDate,
        releaseDate: m.releaseDate,
        notes: m.notes,
        personalAxis: m.personalAxis,
        isExample: m.isExample,
        skills: Object.fromEntries(
          m.skills.filter((s) => s.level > 0).map((s) => [skillNames.get(s.skillId), s.level]),
        ),
        training: m.skills.filter((s) => s.inTraining).map((s) => skillNames.get(s.skillId)),
      })),
      assessments: this.assessments.list().map((a) => ({
        id: a.id,
        memberId: a.memberId,
        date: a.date,
        scores: a.scores,
        goal: a.goal,
        personalAxis: a.personalAxis,
      })),
    };
  }

  exportCsv(): string {
    const axes = this.settings.getAxes();
    const skillNames = new Map(this.skills.list().map((s) => [s.id, s.name]));
    const header = [
      'שם',
      'תפקיד',
      'תאריך הצטרפות',
      'תאריך שחרור',
      'תאריך מיקום',
      ...axes.slice(0, PERSONAL_AXIS_INDEX),
      'ציר אישי',
      'ציון ציר אישי',
      'ממוצע',
      'יעד',
      'מקצועיות',
      'בהכשרה',
    ];
    const rows: (string | number | null)[][] = [header];
    const byMember = Map.groupBy(this.assessments.list(), (a) => a.memberId);

    for (const m of this.members.list()) {
      const skillText = m.skills
        .filter((s) => s.level > 0)
        .map((s) => `${skillNames.get(s.skillId)} (${SKILL_LEVELS[s.level]?.label})`)
        .join('; ');
      const trainingText = m.skills
        .filter((s) => s.inTraining)
        .map((s) => skillNames.get(s.skillId))
        .join('; ');
      const base = [m.name, m.role, m.startDate, m.releaseDate];
      const placements = byMember.get(m.id) ?? [];

      if (placements.length === 0) {
        rows.push([
          ...base,
          null,
          ...Array(AXIS_COUNT + 1).fill(null),
          null,
          null,
          skillText,
          trainingText,
        ]);
        continue;
      }
      for (const a of placements) {
        rows.push([
          ...base,
          a.date,
          ...a.scores.slice(0, PERSONAL_AXIS_INDEX),
          a.personalAxis || axes[PERSONAL_AXIS_INDEX] || '',
          a.scores[PERSONAL_AXIS_INDEX] ?? null,
          average(a.scores).toFixed(1),
          a.goal,
          skillText,
          trainingText,
        ]);
      }
    }
    return toCsv(rows);
  }

  /** Merges a backup into the database. Records with the same id are replaced. */
  import(backup: Backup): ImportResultDto {
    const result: ImportResultDto = { members: 0, assessments: 0, skills: 0 };

    this.db.transaction((tx) => {
      if (backup.axes?.length === AXIS_COUNT && backup.axes.every((a) => a.trim())) {
        this.settings.setAxes(
          backup.axes.map((a) => a.trim().slice(0, 24)),
          tx,
        );
      }

      const skillIds = new Map<string, string>();
      const skillId = (name: string) => {
        const key = name.trim();
        let id = skillIds.get(key);
        if (!id) {
          id = this.skills.ensure(tx, key);
          skillIds.set(key, id);
        }
        return id;
      };
      for (const name of backup.skills ?? []) if (name.trim()) skillId(name);

      const now = nowIso();
      const importedIds = new Set<string>();
      for (const m of backup.members) {
        const values = {
          name: m.name.trim(),
          role: (m.role ?? '').trim(),
          startDate: validDate(m.startDate),
          releaseDate: validDate(m.releaseDate),
          notes: (m.notes ?? '').trim(),
          personalAxis: (m.personalAxis ?? m.otherLabel ?? '').trim(),
          isExample: m.isExample ?? m.example ?? false,
          updatedAt: now,
        };
        tx.insert(members)
          .values({ id: m.id, ...values, createdAt: now })
          .onConflictDoUpdate({ target: members.id, set: values })
          .run();
        importedIds.add(m.id);

        // Older exports listed expertise without levels; treat it as expert.
        const levels = new Map<string, number>();
        for (const name of m.expertise ?? []) if (name.trim()) levels.set(skillId(name), 3);
        for (const [name, level] of Object.entries(m.skills ?? {})) {
          if (name.trim()) levels.set(skillId(name), clampLevel(level));
        }
        const training = new Set((m.training ?? []).filter((n) => n.trim()).map(skillId));

        tx.delete(memberSkills).where(eq(memberSkills.memberId, m.id)).run();
        for (const id of new Set([...levels.keys(), ...training])) {
          const level = levels.get(id) ?? 0;
          if (level === 0 && !training.has(id)) continue;
          tx.insert(memberSkills)
            .values({ memberId: m.id, skillId: id, level, inTraining: training.has(id) })
            .run();
        }
        result.members += 1;
      }

      for (const a of backup.assessments) {
        // The original version also stored a team-lead rating; it is not carried over.
        if (a.kind && a.kind !== 'self') continue;
        const exists =
          importedIds.has(a.memberId) ||
          tx.select({ id: members.id }).from(members).where(eq(members.id, a.memberId)).get();
        if (!exists) continue;

        const idTaken = tx
          .select({ memberId: assessments.memberId, date: assessments.date })
          .from(assessments)
          .where(eq(assessments.id, a.id))
          .get();
        const id =
          !idTaken || (idTaken.memberId === a.memberId && idTaken.date === a.date) ? a.id : newId();
        const values = {
          scores: normalizeScores(a.scores),
          goal: (a.goal ?? '').trim(),
          personalAxis: (a.personalAxis ?? a.otherLabel ?? '').trim(),
          updatedAt: now,
        };
        tx.insert(assessments)
          .values({ id, memberId: a.memberId, date: a.date, ...values, createdAt: now })
          .onConflictDoUpdate({ target: [assessments.memberId, assessments.date], set: values })
          .run();
        result.assessments += 1;
      }
      result.skills = new Set(skillIds.values()).size;
    });

    return result;
  }
}
