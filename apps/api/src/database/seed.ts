/**
 * Loads a sample team so the app can be explored before real data is added.
 * Every record is flagged as an example and can be removed from Settings.
 * Usage: pnpm --filter @team-radar/api db:seed
 */
import '../load-env.js';
import { todayIso } from '@team-radar/shared';
import { count } from 'drizzle-orm';
import { newId, nowIso } from '../common/time.js';
import { skillKey } from '../skills/skill-key.js';
import { createDb, openSqlite } from './database.js';
import { assessments, members, memberSkills, skills } from './schema.js';

function shiftDate(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const SKILLS = ['DevOps', 'Kubernetes', 'Kafka', 'React', 'NestJS', 'Trino', 'בדיקות'];

interface SampleMember {
  name: string;
  role: string;
  startedDaysAgo: number;
  releaseInDays: number;
  personalAxis: string;
  skills: Record<string, number>;
  training?: string[];
  placements: { daysAgo: number; scores: number[]; goal: string }[];
}

const TEAM: SampleMember[] = [
  {
    name: 'עומר',
    role: 'מפתח Backend ותשתיות',
    startedDaysAgo: 760,
    releaseInDays: 70,
    personalAxis: 'הדרכה והעברת ידע',
    skills: { DevOps: 3, Kubernetes: 3, Kafka: 2, Trino: 2 },
    placements: [
      { daysAgo: 160, scores: [8, 7, 8, 6, 5, 4], goal: 'לתעד את תהליך הפריסה' },
      { daysAgo: 20, scores: [9, 7, 9, 7, 6, 6], goal: 'להעביר את DevOps למאיה לפני השחרור' },
    ],
  },
  {
    name: 'נועה',
    role: 'מפתחת Full-stack',
    startedDaysAgo: 540,
    releaseInDays: 150,
    personalAxis: 'ניהול',
    skills: { React: 3, NestJS: 3, Kafka: 2 },
    placements: [
      { daysAgo: 120, scores: [7, 6, 6, 8, 6, 4], goal: 'להוביל סקירות קוד' },
      { daysAgo: 12, scores: [8, 7, 7, 8, 7, 6], goal: 'לחנוך מפתח חדש בצוות' },
    ],
  },
  {
    name: 'איתי',
    role: 'מפתח Backend',
    startedDaysAgo: 300,
    releaseInDays: 420,
    personalAxis: 'סקרנות טכנולוגית',
    skills: { NestJS: 2, Trino: 1, Kafka: 1 },
    training: ['Kafka'],
    placements: [
      { daysAgo: 100, scores: [5, 6, 4, 7, 4, 7], goal: 'לקחת פיצ׳ר מקצה לקצה' },
      { daysAgo: 8, scores: [6, 7, 6, 7, 5, 8], goal: 'ללמוד Kafka לעומק' },
    ],
  },
  {
    name: 'מאיה',
    role: 'מפתחת Full-stack',
    startedDaysAgo: 200,
    releaseInDays: 560,
    personalAxis: 'Networking',
    skills: { React: 2, DevOps: 1 },
    training: ['DevOps'],
    placements: [{ daysAgo: 30, scores: [5, 7, 5, 8, 6, 5], goal: 'לפרוס גרסה לבד' }],
  },
  {
    name: 'דניאל',
    role: 'מפתח Frontend',
    startedDaysAgo: 90,
    releaseInDays: 690,
    personalAxis: 'Work-life balance',
    skills: { React: 1 },
    placements: [{ daysAgo: 5, scores: [4, 5, 3, 6, 5, 6], goal: 'להכיר את מבנה המערכת' }],
  },
  {
    name: 'יעל',
    role: 'בודקת תוכנה',
    startedDaysAgo: 400,
    releaseInDays: 240,
    personalAxis: 'איכות ובדיקות',
    skills: { בדיקות: 3, React: 1 },
    placements: [{ daysAgo: 140, scores: [7, 5, 7, 7, 8, 7], goal: 'לבנות סט בדיקות אוטומטיות' }],
  },
];

const sqlite = openSqlite(process.env.DATABASE_PATH ?? 'data/team-radar.db');
const db = createDb(sqlite);

const [{ value: existing } = { value: 0 }] = db.select({ value: count() }).from(members).all();
if (existing > 0) {
  console.log(`The database already has ${existing} members. Nothing was added.`);
} else {
  const today = todayIso();
  const now = nowIso();
  db.transaction((tx) => {
    const skillIds = new Map<string, string>();
    for (const name of SKILLS) {
      const id = newId();
      skillIds.set(name, id);
      tx.insert(skills)
        .values({ id, name, nameKey: skillKey(name), createdAt: now })
        .run();
    }

    TEAM.forEach((sample, index) => {
      const memberId = newId();
      const createdAt = new Date(Date.now() - (TEAM.length - index) * 1000).toISOString();
      tx.insert(members)
        .values({
          id: memberId,
          name: sample.name,
          role: sample.role,
          startDate: shiftDate(today, -sample.startedDaysAgo),
          releaseDate: shiftDate(today, sample.releaseInDays),
          notes: '',
          personalAxis: sample.personalAxis,
          isExample: true,
          createdAt,
          updatedAt: createdAt,
        })
        .run();

      const training = new Set(sample.training ?? []);
      for (const name of new Set([...Object.keys(sample.skills), ...training])) {
        tx.insert(memberSkills)
          .values({
            memberId,
            skillId: skillIds.get(name)!,
            level: sample.skills[name] ?? 0,
            inTraining: training.has(name),
          })
          .run();
      }

      for (const placement of sample.placements) {
        tx.insert(assessments)
          .values({
            id: newId(),
            memberId,
            date: shiftDate(today, -placement.daysAgo),
            scores: placement.scores,
            goal: placement.goal,
            personalAxis: sample.personalAxis,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    });
  });
  console.log(`Added ${TEAM.length} sample members and ${SKILLS.length} skills.`);
}

sqlite.close();
