import { PERSONAL_AXIS_INDEX, releaseStatus } from '@team-radar/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { IconBack, IconEdit } from '../../components/Icons';
import { EmptyState, ErrorState, LoadingState, PageHeader, Panel } from '../../components/Layout';
import { ExampleChip, Pill } from '../../components/Pill';
import { formatDate, releaseLabel, seniorityLabel } from '../../lib/format';
import { useTeamData } from '../../lib/queries';
import { axisLabelsFor, placementsFor } from '../../lib/team';
import { useToday } from '../../lib/use-today';
import { MemberFormDialog } from '../team/MemberFormDialog';
import { MemberSkills } from './MemberSkills';
import { PlacementEditor } from './PlacementEditor';
import { PlacementHistory } from './PlacementHistory';
import { Trends } from './Trends';
import styles from './MemberPage.module.css';

export function MemberPage() {
  const { memberId } = useParams();
  const data = useTeamData();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  if (data.status === 'loading') return <LoadingState />;
  if (data.status === 'error') return <ErrorState onRetry={data.retry} />;

  const member = data.members.find((m) => m.id === memberId);
  if (!member) {
    return (
      <EmptyState title="החייל לא נמצא" action={<Link to="/">חזרה לצוות</Link>}>
        ייתכן שהוא נמחק.
      </EmptyState>
    );
  }

  const axes = data.settings.axes;
  const placements = placementsFor(member.id, data.assessments);
  const labels = axisLabelsFor(member, axes);
  const compare = placements.find((p) => p.id === compareId);
  const release = releaseStatus(member.releaseDate, today);
  const seniority = seniorityLabel(member.startDate, today);

  return (
    <>
      <Link to="/" className={styles.back}>
        <IconBack width={16} height={16} />
        כל הצוות
      </Link>

      <PageHeader
        title={member.name}
        actions={
          <Button icon={<IconEdit />} onClick={() => setEditing(true)}>
            עריכת פרטים
          </Button>
        }
      >
        {member.role && <p className={styles.role}>{member.role}</p>}
        <div className={styles.meta}>
          {seniority && <Pill>{seniority}</Pill>}
          {release && (
            <Pill tone={release.released ? 'neutral' : release.severity}>
              {releaseLabel(release)} ·{' '}
              <span className="num">{formatDate(member.releaseDate)}</span>
            </Pill>
          )}
          {member.isExample && <ExampleChip />}
        </div>
      </PageHeader>

      <div className={styles.grid}>
        <PlacementEditor
          key={member.id}
          member={member}
          placements={placements}
          axes={axes}
          labels={labels}
          compare={compare}
          today={today}
        />
        <div className={styles.side}>
          <PlacementHistory
            placements={placements}
            axes={axes}
            currentAxis={labels[PERSONAL_AXIS_INDEX] ?? ''}
            compareId={compareId}
            onCompare={(id) => setCompareId((current) => (current === id ? null : id))}
          />
          <Trends placements={placements} axes={axes} labels={labels} />
          <MemberSkills member={member} skills={data.skills} />
          <Panel title="פרטים" index={4}>
            <dl className={styles.details}>
              <dt>הצטרף לצוות</dt>
              <dd className="num">{formatDate(member.startDate) || '—'}</dd>
              <dt>תאריך שחרור</dt>
              <dd className="num">{formatDate(member.releaseDate) || '—'}</dd>
              {member.notes && (
                <>
                  <dt>הערות</dt>
                  <dd className={styles.notes}>{member.notes}</dd>
                </>
              )}
            </dl>
          </Panel>
        </div>
      </div>

      <MemberFormDialog open={editing} onClose={() => setEditing(false)} member={member} />
    </>
  );
}
