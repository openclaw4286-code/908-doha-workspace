import { useState } from 'react';
import { LayoutGrid, NotebookPen, Paperclip, Lock, Plus, Search } from 'lucide-react';
import BoardTab from './tabs/BoardTab.jsx';
import NotesTab from './tabs/NotesTab.jsx';
import FilesTab from './tabs/FilesTab.jsx';
import VaultTab from './tabs/VaultTab.jsx';

const TABS = [
  { id: 'board', label: 'Board', icon: LayoutGrid, Component: BoardTab },
  { id: 'notes', label: 'Notes', icon: NotebookPen, Component: NotesTab },
  { id: 'files', label: 'Files', icon: Paperclip, Component: FilesTab },
  { id: 'vault', label: 'Vault', icon: Lock, Component: VaultTab },
];

export default function App() {
  const [active, setActive] = useState('board');
  const current = TABS.find((t) => t.id === active);
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
        <nav className="flex flex-col gap-0.5 px-3 py-2">
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
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 items-center gap-3 border-b px-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
        >
          <div className="t-heading1">{current.label}</div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => {
                if (active !== 'board') setActive('board');
                window.dispatchEvent(new CustomEvent('workspace:new-task'));
              }}
              className="flex h-9 items-center gap-1.5 rounded-md px-3 t-label"
              style={{ background: 'var(--accent-brand)', color: 'var(--text-inverted)' }}
            >
              <Plus size={16} strokeWidth={2} />
              New
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Current />
        </main>
      </div>
    </div>
  );
}
