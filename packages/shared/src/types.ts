import { type SkillLevel } from './constants.js';

export interface SkillDto {
  id: string;
  name: string;
}

export interface MemberSkillDto {
  skillId: string;
  level: SkillLevel;
  inTraining: boolean;
}

export interface MemberDto {
  id: string;
  name: string;
  role: string;
  startDate: string | null;
  releaseDate: string | null;
  notes: string;
  /** Label of the soldier's personal sixth axis; empty means the team default. */
  personalAxis: string;
  isExample: boolean;
  skills: MemberSkillDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentDto {
  id: string;
  memberId: string;
  date: string;
  scores: number[];
  goal: string;
  /** The personal-axis label at the time of the placement. */
  personalAxis: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsDto {
  axes: string[];
}

export interface ImportResultDto {
  members: number;
  assessments: number;
  skills: number;
}
