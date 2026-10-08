import { useState } from 'react';
import { Button } from '../../components/Button';
import { errorMessage } from '../../lib/api';
import { useDeleteExamples } from '../../lib/queries';
import { useToast } from '../../lib/toast';
import styles from './TeamPage.module.css';

export function ExamplesNotice({ count }: { count: number }) {
  const [confirming, setConfirming] = useState(false);
  const remove = useDeleteExamples();
  const toast = useToast();

  const confirm = () =>
    remove.mutate(undefined, {
      onSuccess: () => toast('נתוני הדוגמה נמחקו'),
      onError: (error) => toast(errorMessage(error), 'error'),
    });

  return (
    <div className={styles.notice}>
      <p>
        {count === 1 ? 'יש כאן חייל דוגמה אחד' : `יש כאן ${count} חיילי דוגמה`} כדי להראות איך זה
        נראה. אחרי שתוסיף את החיילים שלך אפשר למחוק אותם.
      </p>
      {confirming ? (
        <span className={styles.noticeActions}>
          <Button variant="danger-solid" size="sm" onClick={confirm} disabled={remove.isPending}>
            למחוק את הדוגמאות
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            ביטול
          </Button>
        </span>
      ) : (
        <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
          מחיקת הדוגמאות
        </Button>
      )}
    </div>
  );
}
