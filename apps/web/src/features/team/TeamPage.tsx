import {
  ASSESSMENT_STALE_DAYS,
  type AssessmentDto,
  daysBetween,
  type MemberDto,
  releaseStatus,
} from '@team-radar/shared';
import { type CSSProperties, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/Button';
import { IconPlus } from '../../components/Icons';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionHeader,
} from '../../components/Layout';
import { ExampleChip, Pill } from '../../components/Pill';
import { Radar } from '../../components/Radar';
import { Segmented } from '../../components/Segmented';
import { releaseLabel, seniorityLabel, updatedLabel } from '../../lib/format';
import { useTeamData } from '../../lib/queries';
import { latestPlacements } from '../../lib/team';
import { useToday } from '../../lib/use-today';
import { ExamplesNotice } from './ExamplesNotice';
import { MemberFormDialog } from './MemberFormDialog';
import { TeamSummary } from './TeamSummary';
import styles from './TeamPage.module.css';

type SortKey = 'release' | 'name';

const SORT_OPTIONS = [
  { value: 'release', label: 'לפי שחרור' },
  { value: 'name', label: 'לפי שם' },
] as const;

function sortMembers(members: MemberDto[], sort: SortKey, today: string): MemberDto[] {
  const byName = (a: MemberDto, b: MemberDto) => a.name.localeCompare(b.name, 'he');
  if (sort === 'name') return [...members].sort(byName);
  // Soonest release first; no date next; already released last.
  const rank = (m: MemberDto) => {
    const status = releaseStatus(m.releaseDate, today);
    if (!status) return 1e9;
    return status.released ? 2e9 : status.daysLeft;
  };
  return [...members].sort((a, b) => rank(a) - rank(b) || byName(a, b));
}

export function TeamPage() {
  const data = useTeamData();
  const today = useToday();
  const [sort, setSort] = useState<SortKey>('release');
  const [adding, setAdding] = useState(false);

  if (data.status === 'loading') return <LoadingState />;
  if (data.status === 'error') return <ErrorState onRetry={data.retry} />;

  const { members, assessments, settings } = data;
  const latest = latestPlacements(assessments);
  const exampleCount = members.filter((m) => m.isExample).length;

  return (
    <>
      <PageHeader
        eyebrow="הערכה אישית · פיתוח חיילים"
        title="הצוות"
        actions={
          <Button variant="primary" icon={<IconPlus />} onClick={() => setAdding(true)}>
            הוספת חייל
          </Button>
        }
      />

      {exampleCount > 0 && <ExamplesNotice count={exampleCount} />}

      {members.length === 0 ? (
        <EmptyState
          art={<Radar variant="mini" label="מפה ריקה" layers={[]} />}
          title="עוד אין חיילים בצוות"
          action={
            <Button variant="primary" icon={<IconPlus />} onClick={() => setAdding(true)}>
              הוספת החייל הראשון
            </Button>
          }
        >
          הוסף חייל, שב איתו, ותן לו למקם את עצמו על ששת הצירים. כל מיקום נשמר עם תאריך, כך שתראה
          איך הוא מתקדם.
        </EmptyState>
      ) : (
        <>
          <TeamSummary members={members} latest={latest} axes={settings.axes} today={today} />

          <SectionHeader
            title="החיילים"
            aside={
              <Segmented label="מיון" options={SORT_OPTIONS} value={sort} onChange={setSort} />
            }
          />
          <ul className={styles.roster}>
            {sortMembers(members, sort, today).map((member, index) => (
              <li key={member.id} className="rise" style={{ '--i': index } as CSSProperties}>
                <MemberCard member={member} latest={latest.get(member.id)} today={today} />
              </li>
            ))}
          </ul>
        </>
      )}

      <MemberFormDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function MemberCard({
  member,
  latest,
  today,
}: {
  member: MemberDto;
  latest: AssessmentDto | undefined;
  today: string;
}) {
  const release = releaseStatus(member.releaseDate, today);
  const seniority = seniorityLabel(member.startDate, today);
  const stale = latest !== undefined && daysBetween(latest.date, today) > ASSESSMENT_STALE_DAYS;

  return (
    <Link to={`/members/${member.id}`} className={styles.card}>
      <Radar
        className={styles.cardRadar}
        variant="mini"
        label={latest ? `מיקום אחרון של ${member.name}` : `${member.name} עוד לא מוקם`}
        layers={
          latest ? [{ id: latest.id, scores: latest.scores, tone: 'self', filled: true }] : []
        }
      />
      <span className={styles.cardBody}>
        <span className={styles.cardName}>
          {member.name}
          {member.isExample && <ExampleChip />}
        </span>
        <span className={styles.cardRole}>
          {[member.role, seniority].filter(Boolean).join(' · ') || ' '}
        </span>
        <span className={styles.cardMeta}>
          {release && (
            <Pill
              tone={
                release.released ? 'neutral' : release.severity === 'ok' ? 'ok' : release.severity
              }
            >
              {releaseLabel(release)}
            </Pill>
          )}
          {!latest ? (
            <Pill tone="warning">טרם מוקם</Pill>
          ) : stale ? (
            <Pill tone="warning">הגיע זמן לעדכן</Pill>
          ) : (
            <Pill>{updatedLabel(latest.date, today)}</Pill>
          )}
        </span>
      </span>
    </Link>
  );
}
