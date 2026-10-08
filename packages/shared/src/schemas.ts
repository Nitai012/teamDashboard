import { z } from 'zod';
import { AXIS_COUNT, SCORE_MAX, SCORE_MIN } from './constants.js';
import { isIsoDate } from './dates.js';

const isoDate = z.string().refine(isIsoDate, { message: 'Expected a date in YYYY-MM-DD format' });

export const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const memberInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(80).default(''),
  startDate: isoDate.nullable().default(null),
  releaseDate: isoDate.nullable().default(null),
  notes: z.string().trim().max(2000).default(''),
  personalAxis: z.string().trim().max(40).default(''),
});

export const memberUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    role: z.string().trim().max(80),
    startDate: isoDate.nullable(),
    releaseDate: isoDate.nullable(),
    notes: z.string().trim().max(2000),
    personalAxis: z.string().trim().max(40),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update' });

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
});

export const memberSkillInputSchema = z.object({
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  inTraining: z.boolean(),
});

export const scoresSchema = z.array(z.int().min(SCORE_MIN).max(SCORE_MAX)).length(AXIS_COUNT);

export const assessmentInputSchema = z.object({
  scores: scoresSchema,
  goal: z.string().trim().max(500).default(''),
});

export const axesSchema = z.array(z.string().trim().min(1).max(24)).length(AXIS_COUNT);

export const settingsInputSchema = z.object({
  axes: axesSchema,
});

export const isoDateParamSchema = isoDate;

/**
 * Backup format. Lenient on purpose: it also accepts exports from the original
 * single-page version (which used `otherLabel`, `expertise` and `kind`).
 */
export const backupSchema = z.object({
  app: z.string().optional(),
  version: z.number().optional(),
  axes: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  members: z
    .array(
      z.object({
        id: z.string().min(1).max(120),
        name: z.string().trim().min(1).max(80),
        role: z.string().max(80).optional(),
        startDate: z.string().nullish(),
        releaseDate: z.string().nullish(),
        notes: z.string().max(2000).optional(),
        personalAxis: z.string().max(40).optional(),
        otherLabel: z.string().max(40).optional(),
        skills: z.record(z.string(), z.number()).optional(),
        expertise: z.array(z.string()).optional(),
        training: z.array(z.string()).optional(),
        example: z.boolean().optional(),
        isExample: z.boolean().optional(),
      }),
    )
    .max(1000),
  assessments: z
    .array(
      z.object({
        id: z.string().min(1).max(120),
        memberId: z.string().min(1).max(120),
        kind: z.string().optional(),
        date: isoDate,
        scores: z.array(z.number()),
        goal: z.string().max(500).optional(),
        personalAxis: z.string().max(40).optional(),
        otherLabel: z.string().max(40).optional(),
      }),
    )
    .max(20000),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type MemberInput = z.input<typeof memberInputSchema>;
export type MemberInputData = z.output<typeof memberInputSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type MemberSkillInput = z.infer<typeof memberSkillInputSchema>;
export type AssessmentInput = z.input<typeof assessmentInputSchema>;
export type AssessmentInputData = z.output<typeof assessmentInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type Backup = z.infer<typeof backupSchema>;
