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
  const Current = TABS.find((t) => t.id === active).Component;

  return (
    <div className="flex h-full flex-col">
      <header
        className="flex h-14 items-center gap-5 border-b px-5"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
      >
        <div className="t-heading1" style={{ letterSpacing: '-0.01em' }}>
          908doha <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>Workspace</span>
        </div>
        <nav className="ml-4 flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 t-label transition-colors"
                style={{
                  background: on ? 'var(--accent-brand-soft)' : 'transparent',
                  color: on ? 'var(--text-brand)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.75} />
          </button>
          <button
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
  );
}
