import { AXIS_COUNT, type ImportResultDto, PERSONAL_AXIS_INDEX } from '@team-radar/shared';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Field';
import { IconDownload, IconLogout, IconUpload } from '../../components/Icons';
import { ErrorState, LoadingState, PageHeader, Panel } from '../../components/Layout';
import { Segmented } from '../../components/Segmented';
import { BACKUP_CSV_URL, BACKUP_JSON_URL, errorMessage } from '../../lib/api';
import { useImportBackup, useLogout, useSaveAxes, useTeamData } from '../../lib/queries';
import { type ThemeMode, useTheme } from '../../lib/theme';
import { useToast } from '../../lib/toast';
import { ExamplesNotice } from '../team/ExamplesNotice';
import styles from './SettingsPage.module.css';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'לפי המכשיר' },
  { value: 'light', label: 'בהיר' },
  { value: 'dark', label: 'כהה' },
];

const AXIS_POSITIONS = ['למעלה', 'ימין למעלה', 'ימין למטה', 'למטה', 'שמאל למטה', 'שמאל למעלה'];

export function SettingsPage() {
  const data = useTeamData();
  const { mode, setMode } = useTheme();

  if (data.status === 'loading') return <LoadingState />;
  if (data.status === 'error') return <ErrorState onRetry={data.retry} />;

  const examples = data.members.filter((m) => m.isExample).length;

  return (
    <>
      <PageHeader title="הגדרות" />
      <div className={styles.stack}>
        <Panel title="מראה" index={0}>
          <Segmented
            label="ערכת צבעים"
            options={THEME_OPTIONS}
            value={mode}
            onChange={setMode}
            block
          />
        </Panel>

        <AxesPanel axes={data.settings.axes} />
        <BackupPanel />

        {examples > 0 && (
          <Panel title="נתוני דוגמה" index={3}>
            <ExamplesNotice count={examples} />
          </Panel>
        )}

        <AccountPanel />
      </div>
    </>
  );
}

function AxesPanel({ axes }: { axes: string[] }) {
  const [values, setValues] = useState(axes);
  const save = useSaveAxes();
  const toast = useToast();
  const changed = values.some((v, i) => v.trim() !== axes[i]);
  const valid = values.length === AXIS_COUNT && values.every((v) => v.trim());

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    save.mutate(
      values.map((v) => v.trim()),
      {
        onSuccess: () => toast('שמות הצירים נשמרו'),
        onError: (error) => toast(errorMessage(error), 'error'),
      },
    );
  };

  return (
    <Panel title="שמות הצירים" aside="משותפים לכל הצוות" index={1}>
      <form className={styles.axesForm} onSubmit={submit}>
        <div className={styles.axes}>
          {values.map((value, i) => (
            <TextField
              key={i}
              label={
                i === PERSONAL_AXIS_INDEX
                  ? `${AXIS_POSITIONS[i]} · ברירת המחדל לציר האישי`
                  : AXIS_POSITIONS[i]
              }
              value={value}
              maxLength={24}
              autoComplete="off"
              error={!value.trim() ? 'צריך שם' : undefined}
              onChange={(e) =>
                setValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
              }
            />
          ))}
        </div>
        <div>
          <Button type="submit" variant="primary" disabled={!changed || !valid || save.isPending}>
            שמירת השמות
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function BackupPanel() {
  const [pending, setPending] = useState<{
    data: unknown;
    members: number;
    assessments: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const importBackup = useImportBackup();
  const toast = useToast();

  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPending(null);
    setFileError(null);
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      const record = data as { members?: unknown; assessments?: unknown };
      if (!Array.isArray(record.members) || !Array.isArray(record.assessments))
        throw new Error('shape');
      setPending({ data, members: record.members.length, assessments: record.assessments.length });
    } catch {
      setFileError('הקובץ הזה לא נראה כמו גיבוי של מפת ההתפתחות.');
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    importBackup.mutate(pending.data, {
      onSuccess: (result: ImportResultDto) => {
        setPending(null);
        toast(`שוחזרו ${result.members} חיילים ו־${result.assessments} מיקומים`);
      },
      onError: (error) => toast(errorMessage(error), 'error'),
    });
  };

  return (
    <Panel title="גיבוי ושחזור" index={2}>
      <div className={styles.backup}>
        <p className={styles.text}>
          הנתונים נשמרים בשרת. כאן אפשר להוריד עותק: קובץ גיבוי מלא לשחזור, או טבלה שנפתחת באקסל.
        </p>
        <div className={styles.actions}>
          <a className={styles.linkButton} href={BACKUP_JSON_URL} download>
            <IconDownload />
            הורדת גיבוי (JSON)
          </a>
          <a className={styles.linkButton} href={BACKUP_CSV_URL} download>
            <IconDownload />
            ייצוא לאקסל (CSV)
          </a>
        </div>

        <div className={styles.divider} />

        <p className={styles.text}>
          שחזור מקובץ גיבוי. אפשר גם לטעון גיבוי מהגרסה הקודמת של העמוד. רשומות עם אותו מזהה יוחלפו.
        </p>
        <label className={styles.fileButton}>
          <IconUpload />
          בחירת קובץ גיבוי
          <input
            type="file"
            accept=".json,application/json"
            onChange={pickFile}
            className="visually-hidden"
          />
        </label>
        {fileError && <p className={styles.error}>{fileError}</p>}
        {pending && (
          <div className={styles.importConfirm}>
            <span>
              בקובץ יש <b className="num">{pending.members}</b> חיילים ו־
              <b className="num">{pending.assessments}</b> מיקומים.
            </span>
            <span className={styles.actions}>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmImport}
                disabled={importBackup.isPending}
              >
                {importBackup.isPending ? 'משחזר…' : 'שחזור'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
                ביטול
              </Button>
            </span>
          </div>
        )}
      </div>
    </Panel>
  );
}

function AccountPanel() {
  const logout = useLogout();
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <Panel title="חשבון" index={4}>
      <div className={styles.account}>
        <p className={styles.text}>העמוד מוגן בסיסמה. אל תכניס כאן מידע מסווג.</p>
        <Button
          icon={<IconLogout />}
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => navigate('/login', { replace: true }),
              onError: (error) => toast(errorMessage(error), 'error'),
            })
          }
        >
          יציאה
        </Button>
      </div>
    </Panel>
  );
}
