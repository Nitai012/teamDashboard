import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull().default(''),
  startDate: text('start_date'),
  releaseDate: text('release_date'),
  notes: text('notes').notNull().default(''),
  personalAxis: text('personal_axis').notNull().default(''),
  isExample: integer('is_example', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  /** Normalised name used to keep skills unique regardless of case or spacing. */
  nameKey: text('name_key').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

export const memberSkills = sqliteTable(
  'member_skills',
  {
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    level: integer('level').notNull().default(0),
    inTraining: integer('in_training', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.memberId, table.skillId] })],
);

export const assessments = sqliteTable(
  'assessments',
  {
    id: text('id').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    scores: text('scores', { mode: 'json' }).$type<number[]>().notNull(),
    goal: text('goal').notNull().default(''),
    personalAxis: text('personal_axis').notNull().default(''),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('assessments_member_date_idx').on(table.memberId, table.date)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
});

export type MemberRow = typeof members.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type MemberSkillRow = typeof memberSkills.$inferSelect;
export type AssessmentRow = typeof assessments.$inferSelect;
