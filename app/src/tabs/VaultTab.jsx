import { useEffect, useMemo, useState } from 'react';
import { Lock, Plus } from 'lucide-react';
import Button from '../components/Button.jsx';
import SearchField from '../components/SearchField.jsx';
import VaultUnlock from '../components/VaultUnlock.jsx';
import VaultEntry from '../components/VaultEntry.jsx';
import VaultEntryEditor from '../components/VaultEntryEditor.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { useViewport } from '../contexts/ViewportContext.jsx';
import { emptyEntry, fetchVaultRow, initVault, saveEntries, unlockVault } from '../lib/vault.js';

export default function VaultTab() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { readOnly } = useViewport();

  const [status, setStatus] = useState('checking'); // checking | uninitialized | locked | unlocked
  const [master, setMaster] = useState('');
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const row = await fetchVaultRow();
        setStatus(row ? 'locked' : 'uninitialized');
      } catch (e) {
        toast.error(`보관함 상태 확인 실패: ${e.message ?? e}`);
        setStatus('locked');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        (e.title ?? '').toLowerCase().includes(q) ||
        (e.username ?? '').toLowerCase().includes(q) ||
        (e.url ?? '').toLowerCase().includes(q),
    );
  }, [entries, query]);

  const handleInit = async (pw) => {
    setBusy(true);
    try {
      await initVault(pw, currentUser?.id ?? null);
      setMaster(pw);
      setEntries([]);
      setStatus('unlocked');
      toast.success('보관함을 만들었어요');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (pw) => {
    setBusy(true);
    try {
      const result = await unlockVault(pw);
      if (!result) {
        setStatus('uninitialized');
        return;
      }
      setMaster(pw);
      setEntries(result.entries);
      setStatus('unlocked');
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    setMaster('');
    setEntries([]);
    setEditing(null);
    setStatus('locked');
  };

  const persist = async (nextEntries) => {
    const prev = entries;
    setEntries(nextEntries);
    try {
      await saveEntries(master, nextEntries, currentUser?.id ?? null);
    } catch (e) {
      setEntries(prev);
      toast.error(`저장 실패: ${e.message ?? e}`);
      throw e;
    }
  };

  const save = async (entry) => {
    const idx = entries.findIndex((x) => x.id === entry.id);
    const isNew = idx === -1;
    const next = isNew
      ? [entry, ...entries]
      : entries.map((x) => (x.id === entry.id ? entry : x));
    try {
      await persist(next);
      setEditing(null);
      toast.success(isNew ? '항목을 추가했어요' : '항목을 저장했어요');
    } catch {
      /* handled */
    }
  };

  const remove = async (entry) => {
    if (!confirm(`"${entry.title}"을 삭제할까요?`)) return;
    const next = entries.filter((x) => x.id !== entry.id);
    try {
      await persist(next);
      setEditing(null);
      toast.success('항목을 삭제했어요');
    } catch {
      /* handled */
    }
  };

  const copyPassword = async (entry) => {
    if (!entry.password) {
      toast.info('비밀번호가 비어있어요');
      return;
    }
    try {
      await navigator.clipboard.writeText(entry.password);
      toast.success('비밀번호를 복사했어요');
    } catch {
      toast.error('복사 실패');
    }
  };

  const copyUsername = async (entry) => {
    if (!entry.username) return;
    try {
      await navigator.clipboard.writeText(entry.username);
      toast.success('아이디를 복사했어요');
    } catch {
      toast.error('복사 실패');
    }
  };

  if (status === 'checking') {
    return (
      <div
        className="flex min-h-full items-center justify-center"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span className="t-body2">확인 중…</span>
      </div>
    );
  }

  if (status === 'uninitialized' && readOnly) {
    return (
      <div
        className="mx-auto mt-12 max-w-sm rounded-xl border border-dashed p-8 text-center"
        style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
      >
        <div className="t-heading2" style={{ color: 'var(--text-primary)' }}>
          아직 보관함이 만들어지지 않았어요
        </div>
        <p className="t-body2 mt-1.5">데스크톱에서 마스터 비밀번호를 먼저 설정해주세요.</p>
      </div>
    );
  }

  if (status === 'uninitialized' || status === 'locked') {
    return (
      <VaultUnlock
        isInit={status === 'uninitialized'}
        busy={busy}
        onSubmit={status === 'uninitialized' ? handleInit : handleUnlock}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="t-title3">Vault</h2>
        <span className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
          {entries.length}개
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={Lock}
            onClick={lock}
          >
            잠그기
          </Button>
          {!readOnly && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setEditing(emptyEntry())}
            >
              새 항목
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="제목, 아이디, URL 검색"
          className="w-full"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => (
            <VaultEntry
              key={e.id}
              entry={e}
              onOpen={setEditing}
              onCopyPassword={copyPassword}
              onCopyUsername={copyUsername}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border border-dashed p-8 text-center"
          style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
        >
          <div className="t-heading2" style={{ color: 'var(--text-primary)' }}>
            {query ? '일치하는 항목이 없어요' : '아직 저장된 항목이 없어요'}
          </div>
          {!query && (
            <p className="t-body2 mt-1.5">"새 항목"으로 첫 자격증명을 추가해보세요.</p>
          )}
        </div>
      )}

      <VaultEntryEditor
        open={!!editing}
        entry={editing}
        onSave={save}
        onDelete={remove}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
