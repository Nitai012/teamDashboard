import { type ComponentType, type SVGProps } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { errorMessage } from '../lib/api';
import { cx } from '../lib/cx';
import { useLogout } from '../lib/queries';
import { useTheme } from '../lib/theme';
import { useToast } from '../lib/toast';
import styles from './AppShell.module.css';
import { IconButton } from './Button';
import {
  IconLogout,
  IconMatrix,
  IconMoon,
  IconRadar,
  IconSettings,
  IconSun,
  IconTeam,
} from './Icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    to: '/',
    label: 'הצוות',
    icon: IconTeam,
    isActive: (path) => path === '/' || path.startsWith('/members/'),
  },
  {
    to: '/skills',
    label: 'מקצועיות',
    icon: IconMatrix,
    isActive: (path) => path.startsWith('/skills'),
  },
  {
    to: '/settings',
    label: 'הגדרות',
    icon: IconSettings,
    isActive: (path) => path.startsWith('/settings'),
  },
];

function ThemeToggle() {
  const { resolved, setMode } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  return (
    <IconButton
      label={next === 'dark' ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
      onClick={() => setMode(next)}
    >
      {resolved === 'dark' ? <IconSun /> : <IconMoon />}
    </IconButton>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const toast = useToast();

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
      onError: (error) => toast(errorMessage(error), 'error'),
    });

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        דילוג לתוכן
      </a>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link to="/" className={styles.brand}>
            <IconRadar className={styles.brandMark} />
            <span className={styles.brandName}>מפת התפתחות הצוות</span>
          </Link>
          <nav className={styles.desktopNav} aria-label="ניווט ראשי">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(styles.desktopLink, item.isActive(pathname) && styles.active)}
                aria-current={item.isActive(pathname) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.tools}>
            <ThemeToggle />
            <IconButton label="יציאה" onClick={signOut} disabled={logout.isPending}>
              <IconLogout />
            </IconButton>
          </div>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav} aria-label="ניווט ראשי">
        {NAV.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cx(styles.tab, active && styles.active)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={styles.tabIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
