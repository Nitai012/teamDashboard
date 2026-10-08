import {
  activeMembers,
  ASSESSMENT_STALE_DAYS,
  type AssessmentDto,
  averageScores,
  daysBetween,
  isLeavingWithin,
  type MemberDto,
  PERSONAL_AXIS_INDEX,
  RELEASE_WARNING_DAYS,
} from '@team-radar/shared';
import { Panel, Stat, StatGrid } from '../../components/Layout';
import { Radar } from '../../components/Radar';
import { formatAverage } from '../../lib/format';
import { teamAxisLabels } from '../../lib/team';
import styles from './TeamPage.module.css';

interface TeamSummaryProps {
  members: MemberDto[];
  latest: Map<string, AssessmentDto>;
  axes: string[];
  today: string;
}

export function TeamSummary({ members, latest, axes, today }: TeamSummaryProps) {
  const active = activeMembers(members, today);
  const placements = active.flatMap((m) => latest.get(m.id) ?? []);
  const average = placements.length ? averageScores(placements.map((p) => p.scores)) : null;

  // The personal axis means something different for each soldier, so it is
  // left out when looking for the team's weakest axis.
  const weakest = average
    ?.map((value, axis) => ({ value, axis }))
    .filter(({ axis }) => axis !== PERSONAL_AXIS_INDEX)
    .reduce((min, item) => (item.value < min.value ? item : min));

  const upToDate = placements.filter(
    (p) => daysBetween(p.date, today) <= ASSESSMENT_STALE_DAYS,
  ).length;
  const leaving = active
    .filter((m) => isLeavingWithin(m.releaseDate, today, RELEASE_WARNING_DAYS))
    .map((m) => m.name);
  const released = members.length - active.length;

  return (
    <Panel className={styles.summary} index={0}>
      <figure className={styles.summaryChart}>
        <Radar
          label="ממוצע הצוות לפי המיקום האחרון של כל חייל"
          labels={teamAxisLabels(axes)}
          layers={average ? [{ id: 'team', scores: average, tone: 'self', filled: true }] : []}
        />
        <figcaption className={styles.legend}>
          {average ? (
            <>
              <i className={styles.legendSwatch} aria-hidden="true" />
              ממוצע הצוות לפי המיקום האחרון של כל חייל
            </>
          ) : (
            'הממוצע יופיע אחרי המיקום הראשון'
          )}
        </figcaption>
      </figure>
      <StatGrid>
        <Stat
          label="חיילים פעילים"
          value={<span className="num">{active.length}</span>}
          detail={released ? `${released} השתחררו` : 'בצוות כרגע'}
        />
        <Stat
          label={`מעודכנים (${ASSESSMENT_STALE_DAYS} יום)`}
          value={
            <span className="num">
              {upToDate}/{active.length}
            </span>
          }
          detail={
            active.length - upToDate ? `${active.length - upToDate} מחכים למיקום` : 'כולם מעודכנים'
          }
        />
        <Stat
          label="משתחררים בחצי שנה"
          value={<span className="num">{leaving.length}</span>}
          tone={leaving.length ? 'warning' : undefined}
          detail={leaving.length ? leaving.join(', ') : 'אין שחרורים קרובים'}
        />
        <Stat
          label="הציר לחיזוק בצוות"
          value={weakest ? axes[weakest.axis] : '—'}
          detail={
            weakest ? `ממוצע ${formatAverage(weakest.value)} מתוך 10` : 'יופיע אחרי המיקום הראשון'
          }
        />
      </StatGrid>
    </Panel>
  );
}
