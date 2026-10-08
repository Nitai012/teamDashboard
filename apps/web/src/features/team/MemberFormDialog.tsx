import { type MemberDto } from '@team-radar/shared';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { TextArea, TextField } from '../../components/Field';
import { errorMessage } from '../../lib/api';
import { useCreateMember, useDeleteMember, useUpdateMember } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './TeamPage.module.css';

interface MemberFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Edits this member; creates a new one when absent. */
  member?: MemberDto;
}

export function MemberFormDialog({ open, onClose, member }: MemberFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={member ? 'עריכת פרטים' : 'חייל חדש'}>
      <MemberForm member={member} onDone={onClose} />
    </Dialog>
  );
}

function MemberForm({ member, onDone }: { member?: MemberDto; onDone: () => void }) {
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState(member?.role ?? '');
  const [startDate, setStartDate] = useState(member?.startDate ?? '');
  const [releaseDate, setReleaseDate] = useState(member?.releaseDate ?? '');
  const [notes, setNotes] = useState(member?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreateMember();
  const update = useUpdateMember();
  const remove = useDeleteMember();
  const navigate = useNavigate();
  const toast = useToast();

  const nameError = submitted && !name.trim() ? 'צריך שם כדי לשמור' : undefined;
  const datesError =
    startDate && releaseDate && startDate > releaseDate
      ? 'תאריך ההצטרפות מאוחר מתאריך השחרור'
      : undefined;
  const saving = create.isPending || update.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || datesError) return;

    const input = {
      name: name.trim(),
      role: role.trim(),
      startDate: startDate || null,
      releaseDate: releaseDate || null,
      notes: notes.trim(),
    };
    const onError = (error: unknown) => toast(errorMessage(error), 'error');

    if (member) {
      update.mutate(
        { id: member.id, input },
        {
          onSuccess: () => {
            toast('הפרטים נשמרו');
            onDone();
          },
          onError,
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: (created) => {
          toast(`${created.name} נוסף לצוות`);
          onDone();
          navigate(`/members/${created.id}`);
        },
        onError,
      });
    }
  };

  const deleteMember = () => {
    if (!member) return;
    remove.mutate(member.id, {
      onSuccess: () => {
        toast(`${member.name} נמחק`);
        onDone();
        navigate('/', { replace: true });
      },
      onError: (error) => toast(errorMessage(error), 'error'),
    });
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <TextField
        label="שם"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
        maxLength={80}
        autoFocus={!member}
        error={nameError}
      />
      <TextField
        label="תפקיד"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="למשל: מפתח Backend"
        autoComplete="off"
        maxLength={80}
      />
      <div className={styles.formRow}>
        <TextField
          label="הצטרף לצוות"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          label="תאריך שחרור"
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
          error={datesError}
        />
      </div>
      <TextArea
        label="הערות"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={2000}
        hint="הערות אישיות לך. אל תכניס כאן מידע מסווג."
      />

      <div className={styles.formFooter}>
        {member ? (
          confirmDelete ? (
            <span className={styles.confirm}>
              <span>כל המיקומים שלו יימחקו.</span>
              <Button
                variant="danger-solid"
                size="sm"
                onClick={deleteMember}
                disabled={remove.isPending}
              >
                למחוק
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                ביטול
              </Button>
            </span>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              מחיקת החייל
            </Button>
          )
        ) : (
          <span />
        )}
        <span className={styles.formButtons}>
          <Button variant="ghost" onClick={onDone}>
            ביטול
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'שומר…' : 'שמירה'}
          </Button>
        </span>
      </div>
    </form>
  );
}
