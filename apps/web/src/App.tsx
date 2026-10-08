import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { MemberPage } from './features/member/MemberPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SkillsPage } from './features/skills/SkillsPage';
import { TeamPage } from './features/team/TeamPage';
import { queryClient } from './lib/query-client';
import { ThemeProvider } from './lib/theme';
import { ToastProvider } from './lib/toast';

function NotFound() {
  return (
    <EmptyState title="העמוד לא נמצא" action={<Link to="/">חזרה לצוות</Link>}>
      ייתכן שהקישור ישן.
    </EmptyState>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route index element={<TeamPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="members/:memberId" element={<MemberPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
