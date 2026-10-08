import { type NestExpressApplication } from '@nestjs/platform-express';
import { type MemberDto, type SkillDto } from '@team-radar/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, loggedInAgent } from './helpers.js';

describe('backup', () => {
  const apps: NestExpressApplication[] = [];

  async function freshApi() {
    const app = await createTestApp();
    apps.push(app);
    return loggedInAgent(app);
  }

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it('round-trips an export into an empty database', async () => {
    const source = await freshApi();
    const member = (
      await source
        .post('/api/members')
        .send({ name: 'עומר', releaseDate: '2026-12-20', personalAxis: 'ניהול' })
        .expect(201)
    ).body as MemberDto;
    const skill = (await source.post('/api/skills').send({ name: 'DevOps' }).expect(201))
      .body as SkillDto;
    await source
      .put(`/api/members/${member.id}/skills/${skill.id}`)
      .send({ level: 3, inTraining: false });
    await source
      .put(`/api/members/${member.id}/assessments/2026-10-01`)
      .send({ scores: [8, 7, 8, 6, 5, 4], goal: 'להעביר ידע' });

    const res = await source.get('/api/backup').expect(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="team-radar-backup-/);

    const target = await freshApi();
    const imported = await target.post('/api/backup/import').send(res.body).expect(200);
    expect(imported.body).toEqual({ members: 1, assessments: 1, skills: 1 });

    const members = (await target.get('/api/members')).body as MemberDto[];
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ id: member.id, name: 'עומר', personalAxis: 'ניהול' });
    expect(members[0]?.skills[0]).toMatchObject({ level: 3, inTraining: false });
    expect((await target.get('/api/assessments')).body).toHaveLength(1);
  });

  it('imports the original single-page format', async () => {
    const api = await freshApi();
    const legacy = {
      app: 'team-radar',
      version: 2,
      axes: ['מקצועיות', 'יוזמה', 'עצמאות', 'עבודת צוות', 'מוצר', 'אחר'],
      skills: ['DevOps'],
      members: [
        {
          id: 'mmuwk3ece4c52a',
          name: 'אייל מגור',
          role: 'backend',
          startDate: '',
          releaseDate: '2027-10-27',
          expertise: ['deveops'],
          notes: '',
          createdAt: 1791283748702,
        },
        {
          id: 'm-ex1',
          name: 'חבר צוות 1',
          skills: { React: 3, DevOps: 1 },
          training: ['DevOps'],
          otherLabel: 'Networking',
          example: true,
        },
      ],
      assessments: [
        {
          id: 'a-ex2',
          memberId: 'm-ex1',
          kind: 'self',
          date: '2026-10-06',
          scores: [7, 6, 7, 8, 5, 6],
          otherLabel: 'Networking',
        },
        {
          id: 'a-ex3',
          memberId: 'm-ex1',
          kind: 'lead',
          date: '2026-10-06',
          scores: [7, 7, 6, 8, 6, 5],
        },
        { id: 'a-orphan', memberId: 'nobody', date: '2026-10-06', scores: [5, 5, 5, 5, 5, 5] },
      ],
    };

    const res = await api.post('/api/backup/import').send(legacy).expect(200);
    expect(res.body).toEqual({ members: 2, assessments: 1, skills: 3 });

    const members = (await api.get('/api/members')).body as MemberDto[];
    const eyal = members.find((m) => m.id === 'mmuwk3ece4c52a');
    expect(eyal).toMatchObject({ startDate: null, releaseDate: '2027-10-27', isExample: false });
    expect(eyal?.skills).toEqual([expect.objectContaining({ level: 3 })]);
    expect(members.find((m) => m.id === 'm-ex1')).toMatchObject({
      isExample: true,
      personalAxis: 'Networking',
    });

    const skills = (await api.get('/api/skills')).body as SkillDto[];
    expect(skills.map((s) => s.name).sort()).toEqual(['deveops', 'DevOps', 'React'].sort());
  });

  it('rejects malformed backups', async () => {
    const api = await freshApi();
    await api.post('/api/backup/import').send({ members: 'nope' }).expect(400);
  });

  it('exports CSV with a BOM and neutralises formulas', async () => {
    const api = await freshApi();
    await api.post('/api/members').send({ name: '=HYPERLINK("x")', role: 'בודק, QA' }).expect(201);
    const res = await api.get('/api/backup/csv').expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.startsWith('﻿')).toBe(true);
    expect(res.text).toContain(`"'=HYPERLINK(""x"")"`);
    expect(res.text).toContain('"בודק, QA"');
  });
});
