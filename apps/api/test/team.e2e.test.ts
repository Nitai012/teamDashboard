import { type NestExpressApplication } from '@nestjs/platform-express';
import {
  type AssessmentDto,
  DEFAULT_AXES,
  type MemberDto,
  type SkillDto,
} from '@team-radar/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, loggedInAgent } from './helpers.js';

type Agent = Awaited<ReturnType<typeof loggedInAgent>>;

describe('team API', () => {
  let app: NestExpressApplication;
  let api: Agent;

  beforeEach(async () => {
    app = await createTestApp();
    api = await loggedInAgent(app);
  });

  afterEach(async () => {
    await app.close();
  });

  async function createMember(body: Record<string, unknown> = {}): Promise<MemberDto> {
    const res = await api
      .post('/api/members')
      .send({ name: 'נועה', role: 'מפתחת', releaseDate: '2027-06-01', ...body })
      .expect(201);
    return res.body as MemberDto;
  }

  async function createSkill(name: string): Promise<SkillDto> {
    return (await api.post('/api/skills').send({ name }).expect(201)).body as SkillDto;
  }

  describe('members', () => {
    it('creates, reads, updates and deletes a member', async () => {
      const created = await createMember();
      expect(created).toMatchObject({ name: 'נועה', role: 'מפתחת', isExample: false, skills: [] });

      await api.get(`/api/members/${created.id}`).expect(200);

      const updated = (
        await api.patch(`/api/members/${created.id}`).send({ personalAxis: 'ניהול' }).expect(200)
      ).body as MemberDto;
      expect(updated.personalAxis).toBe('ניהול');
      expect(updated.name).toBe('נועה');

      await api.delete(`/api/members/${created.id}`).expect(204);
      await api.get(`/api/members/${created.id}`).expect(404);
    });

    it('validates input', async () => {
      const res = await api.post('/api/members').send({ name: '   ' }).expect(400);
      expect(res.body.issues[0].path).toBe('name');
      await api.post('/api/members').send({ name: 'x', releaseDate: '31/12/2026' }).expect(400);
      const member = await createMember();
      await api.patch(`/api/members/${member.id}`).send({}).expect(400);
    });

    it('removes only example members', async () => {
      await createMember();
      const res = await api.delete('/api/members/examples').expect(200);
      expect(res.body).toEqual({ removed: 0 });
      expect((await api.get('/api/members').expect(200)).body).toHaveLength(1);
    });
  });

  describe('skills', () => {
    it('sets and clears a member skill level', async () => {
      const member = await createMember();
      const skill = await createSkill('DevOps');

      const withSkill = (
        await api
          .put(`/api/members/${member.id}/skills/${skill.id}`)
          .send({ level: 3, inTraining: false })
          .expect(200)
      ).body as MemberDto;
      expect(withSkill.skills).toEqual([{ skillId: skill.id, level: 3, inTraining: false }]);

      const cleared = (
        await api
          .put(`/api/members/${member.id}/skills/${skill.id}`)
          .send({ level: 0, inTraining: false })
          .expect(200)
      ).body as MemberDto;
      expect(cleared.skills).toEqual([]);

      await api
        .put(`/api/members/${member.id}/skills/${skill.id}`)
        .send({ level: 4, inTraining: false })
        .expect(400);
      await api
        .put(`/api/members/${member.id}/skills/missing`)
        .send({ level: 1, inTraining: false })
        .expect(404);
    });

    it('rejects duplicate names regardless of case and spacing', async () => {
      await createSkill('DevOps');
      await api.post('/api/skills').send({ name: '  devops ' }).expect(409);
    });

    it('merges two skills when one is renamed to the other', async () => {
      const a = await createMember({ name: 'א' });
      const b = await createMember({ name: 'ב' });
      const devops = await createSkill('DevOps');
      const typo = await createSkill('deveops');
      await api
        .put(`/api/members/${a.id}/skills/${devops.id}`)
        .send({ level: 1, inTraining: false });
      await api.put(`/api/members/${a.id}/skills/${typo.id}`).send({ level: 3, inTraining: false });
      await api.put(`/api/members/${b.id}/skills/${typo.id}`).send({ level: 0, inTraining: true });

      const merged = (
        await api.patch(`/api/skills/${typo.id}`).send({ name: 'DEVOPS' }).expect(200)
      ).body as SkillDto;
      expect(merged.id).toBe(devops.id);

      const skills = (await api.get('/api/skills').expect(200)).body as SkillDto[];
      expect(skills.map((s) => s.name)).toEqual(['DevOps']);

      const members = (await api.get('/api/members').expect(200)).body as MemberDto[];
      expect(members.find((m) => m.id === a.id)?.skills).toEqual([
        { skillId: devops.id, level: 3, inTraining: false },
      ]);
      expect(members.find((m) => m.id === b.id)?.skills).toEqual([
        { skillId: devops.id, level: 0, inTraining: true },
      ]);
    });

    it('removes member levels when a skill is deleted', async () => {
      const member = await createMember();
      const skill = await createSkill('Kafka');
      await api
        .put(`/api/members/${member.id}/skills/${skill.id}`)
        .send({ level: 2, inTraining: false });
      await api.delete(`/api/skills/${skill.id}`).expect(204);
      expect(((await api.get(`/api/members/${member.id}`)).body as MemberDto).skills).toEqual([]);
    });
  });

  describe('assessments', () => {
    it('keeps one placement per day and snapshots the personal axis', async () => {
      const member = await createMember({ personalAxis: 'Networking' });
      const url = `/api/members/${member.id}/assessments/2026-10-08`;

      const first = (
        await api
          .put(url)
          .send({ scores: [5, 5, 5, 5, 5, 5], goal: ' יעד ' })
          .expect(200)
      ).body as AssessmentDto;
      expect(first).toMatchObject({ goal: 'יעד', personalAxis: 'Networking' });

      const second = (
        await api
          .put(url)
          .send({ scores: [6, 6, 6, 6, 6, 6] })
          .expect(200)
      ).body as AssessmentDto;
      expect(second.id).toBe(first.id);

      const list = (await api.get(`/api/assessments?memberId=${member.id}`).expect(200))
        .body as AssessmentDto[];
      expect(list).toHaveLength(1);
      expect(list[0]?.scores).toEqual([6, 6, 6, 6, 6, 6]);

      await api.delete(`/api/assessments/${first.id}`).expect(204);
      await api.delete(`/api/assessments/${first.id}`).expect(404);
    });

    it('validates the date and scores', async () => {
      const member = await createMember();
      await api
        .put(`/api/members/${member.id}/assessments/2026-13-01`)
        .send({ scores: [5, 5, 5, 5, 5, 5] })
        .expect(400);
      await api
        .put(`/api/members/${member.id}/assessments/2026-10-08`)
        .send({ scores: [0, 5, 5, 5, 5, 5] })
        .expect(400);
      await api
        .put('/api/members/missing/assessments/2026-10-08')
        .send({ scores: [5, 5, 5, 5, 5, 5] })
        .expect(404);
    });

    it('deletes placements with their member', async () => {
      const member = await createMember();
      await api
        .put(`/api/members/${member.id}/assessments/2026-10-08`)
        .send({ scores: [5, 5, 5, 5, 5, 5] });
      await api.delete(`/api/members/${member.id}`).expect(204);
      expect((await api.get('/api/assessments')).body).toEqual([]);
    });
  });

  describe('settings', () => {
    it('returns default axes and saves new ones', async () => {
      expect((await api.get('/api/settings').expect(200)).body).toEqual({ axes: DEFAULT_AXES });
      const axes = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
      await api.put('/api/settings').send({ axes }).expect(200, { axes });
      await api
        .put('/api/settings')
        .send({ axes: ['א'] })
        .expect(400);
    });
  });
});
