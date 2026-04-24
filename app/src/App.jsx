import { useState } from 'react';
import { LayoutGrid, NotebookPen, Paperclip, Lock, Plus, Search, Settings, LogOut } from 'lucide-react';
import BoardTab from './tabs/BoardTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';
import FilesTab from './tabs/FilesTab.jsx';
import VaultTab from './tabs/VaultTab.jsx';
import SettingsTab from './tabs/SettingsTab.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import FirstRunSetup from './components/FirstRunSetup.jsx';
import MemberAvatar from './components/MemberAvatar.jsx';

const TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid, Component: BoardTab },
  { id: 'notes', label: 'Notes', icon: NotebookPen, Component: NotesTab },
  { id: 'files', label: 'Files', icon: Paperclip, Component: FilesTab },
  { id: 'vault', label: 'Vault', icon: Lock, Component: VaultTab },
];

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}

function AuthGate() {
  const { currentUser, members, loading, error } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-full items-center justify-center"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span className="t-body2">불러오는 중…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full items-center justify-center px-6">
        <div
          className="max-w-md rounded-lg px-4 py-3 t-body2"
          style={{ background: 'var(--state-negative-soft)', color: 'var(--state-negative)' }}
        >
          연결 실패: {error}
        </div>
      </div>
    );
  }

  if (members.length === 0) return <FirstRunSetup />;
  if (!currentUser) return <LoginScreen />;
  return <Shell />;
}

function Shell() {
  const { currentUser, logout } = useAuth();
  const [active, setActive] = useState('board');
  const isSettings = active === 'settings';
  const current = isSettings
    ? { id: 'settings', label: '설정', Component: SettingsTab }
    : TABS.find((t) => t.id === active);
  const Current = current.Component;

  return (
    <div className="flex h-full">
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-layered)' }}
      >
        <div
          className="flex h-14 items-center px-5 t-heading1"
          style={{ letterSpacing: '-0.01em' }}
        >
          908doha{' '}
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 6 }}>
            Workspace
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="flex h-9 items-center gap-2.5 rounded-md px-3 t-label"
                style={{
                  background: on ? 'var(--accent-brand-soft)' : 'transparent',
                  color: on ? 'var(--text-brand)' : 'var(--text-secondary)',
                  transition: 'background 160ms var(--ease-soft), color 160ms var(--ease-soft)',
                }}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
          <div className="mt-auto flex flex-col gap-0.5 pb-2">
            <button
              onClick={() => setActive('settings')}
              className="flex h-9 items-center gap-2.5 rounded-md px-3 t-label"
              style={{
                background: isSettings ? 'var(--accent-brand-soft)' : 'transparent',
                color: isSettings ? 'var(--text-brand)' : 'var(--text-secondary)',
                transition: 'background 160ms var(--ease-soft), color 160ms var(--ease-soft)',
              }}
            >
              <Settings size={16} strokeWidth={1.75} />
              설정
            </button>
          </div>
        </nav>
        {currentUser && (
          <div
            className="flex items-center gap-2.5 border-t px-3 py-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <MemberAvatar member={currentUser} size={28} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="t-label truncate" style={{ color: 'var(--text-primary)' }}>
                {currentUser.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Logout"
              title="로그아웃"
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header
          className="sticky top-0 z-20 flex h-14 items-center gap-3 px-5"
          style={{
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(20px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="t-heading1">{current.label}</div>
          {!isSettings && (
            <div className="ml-auto flex items-center gap-2">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.75} />
              </button>
              {(active === 'board' || active === 'notes') && (
                <button
                  onClick={() => {
                    const evt =
                      active === 'notes' ? 'workspace:new-note' : 'workspace:new-task';
                    window.dispatchEvent(new CustomEvent(evt));
                  }}
                  className="flex h-9 items-center gap-1.5 rounded-md px-3 t-label"
                  style={{ background: 'var(--accent-brand)', color: 'var(--text-inverted)' }}
                >
                  <Plus size={16} strokeWidth={2} />
                  New
                </button>
              )}
            </div>
          )}
        </header>
        <div className="flex-1">
          <Current />
        </div>
      </main>
    </div>
  );
}
