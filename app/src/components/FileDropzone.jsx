import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { MAX_SIZE, formatBytes } from '../lib/files.js';

// Drag-or-click upload zone. Drag handles folders by walking the
// `webkitGetAsEntry` tree so dropping a directory of mixed files
// works the way Notion/Slack/etc do.

export default function FileDropzone({ onFiles, disabled = false, compact = false }) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef(null);

  const acceptList = (files) => {
    if (!files || !files.length || disabled) return;
    onFiles(Array.from(files));
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    const items = e.dataTransfer.items;
    if (items && items.length && items[0].webkitGetAsEntry) {
      const collected = await collectFromItems(items);
      if (collected.length) onFiles(collected);
    } else {
      acceptList(e.dataTransfer.files);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!hover) setHover(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setHover(false);
      }}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center outline-none ${
        compact ? 'px-5 py-5' : 'px-6 py-10'
      }`}
      style={{
        borderColor: hover ? 'var(--border-focus)' : 'var(--border-default)',
        background: hover ? 'var(--accent-brand-soft)' : 'var(--surface-layered)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition:
          'background 160ms var(--ease-soft), border-color 160ms var(--ease-soft)',
      }}
    >
      <UploadCloud
        size={compact ? 22 : 28}
        strokeWidth={1.5}
        style={{ color: hover ? 'var(--accent-brand)' : 'var(--text-tertiary)' }}
      />
      <div
        className={compact ? 't-label' : 't-body2'}
        style={{ color: 'var(--text-primary)', fontWeight: 500 }}
      >
        {hover ? '여기에 놓으세요' : '파일이나 폴더를 드래그하거나 클릭해 업로드'}
      </div>
      <div className="t-caption" style={{ color: 'var(--text-tertiary)' }}>
        최대 {formatBytes(MAX_SIZE)} · 여러 개 / 폴더째 OK
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          acceptList(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// Walk DataTransferItems and pull every File out of any dropped
// directories. webkitGetAsEntry is non-standard but supported by all
// modern browsers (Chromium / WebKit / Firefox).
async function collectFromItems(items) {
  const entries = [];
  for (const item of items) {
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
  }
  const out = [];
  for (const entry of entries) {
    await walk(entry, out);
  }
  return out;
}

async function walk(entry, out) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) =>
      entry.file(resolve, reject),
    );
    // tag with relative path so the row name reflects nested layout
    if (entry.fullPath && entry.fullPath !== `/${file.name}`) {
      try {
        Object.defineProperty(file, '_relativePath', {
          value: entry.fullPath.replace(/^\//, ''),
        });
      } catch {
        /* readonly file objects are fine — name still works */
      }
    }
    out.push(file);
    return;
  }
  if (entry.isDirectory) {
    const reader = entry.createReader();
    const subEntries = [];
    // readEntries returns at most ~100 per call; loop until empty.
    while (true) {
      const batch = await new Promise((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (!batch.length) break;
      subEntries.push(...batch);
    }
    for (const sub of subEntries) await walk(sub, out);
  }
}
