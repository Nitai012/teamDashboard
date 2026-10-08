import {
  isInTraining,
  type MemberDto,
  type SkillDto,
  skillLevel,
  type SkillLevel,
} from '@team-radar/shared';
import { Link } from 'react-router';
import { Panel } from '../../components/Layout';
import { Segmented } from '../../components/Segmented';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/cx';
import { useSetMemberSkill } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './MemberPage.module.css';

const LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 0, label: '—' },
  { value: 1, label: 'לומד' },
  { value: 2, label: 'עצמאי' },
  { value: 3, label: 'מומחה' },
];

export function MemberSkills({ member, skills }: { member: MemberDto; skills: SkillDto[] }) {
  const setSkill = useSetMemberSkill();
  const toast = useToast();

  const save = (skillId: string, level: SkillLevel, inTraining: boolean) =>
    setSkill.mutate(
      { memberId: member.id, skillId, input: { level, inTraining } },
      { onError: (error) => toast(errorMessage(error), 'error') },
    );

  return (
    <Panel title="מקצועיות" aside={<Link to="/skills">לטבלת הצוות</Link>} index={3}>
      {skills.length === 0 ? (
        <p className={styles.muted}>
          עוד אין תחומים. אפשר להוסיף אותם ב<Link to="/skills">מסך המקצועיות</Link>.
        </p>
      ) : (
        <ul className={styles.skills}>
          {skills.map((skill) => {
            const level = skillLevel(member, skill.id);
            const training = isInTraining(member, skill.id);
            return (
              <li key={skill.id} className={styles.skillRow}>
                <span className={styles.skillName}>{skill.name}</span>
                <Segmented
                  label={`הרמה ב־${skill.name}`}
                  options={LEVEL_OPTIONS}
                  value={level}
                  onChange={(next) => save(skill.id, next, training)}
                  disabled={setSkill.isPending}
                />
                <button
                  type="button"
                  className={cx(styles.trainToggle, training && styles.trainOn)}
                  aria-pressed={training}
                  disabled={setSkill.isPending}
                  onClick={() => save(skill.id, level, !training)}
                >
                  בהכשרה
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
