import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Pin, Trash2, X } from 'lucide-react';
import AutoTextarea from './AutoTextarea.jsx';
import IconButton from './IconButton.jsx';
import FormSelect from './FormSelect.jsx';
import { noteHasContent } from '../lib/notes.js';
import { sanitizeHtml, escapeHtml } from '../lib/htmlSanitize.js';
import { useViewport } from '../contexts/ViewportContext.jsx';

const TITLE_MAX = 100;

export default function NotePage({
  note,
  folders,
  folderLabel,
  onBack,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(note);
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const dirtyRef = useRef(false);
  const draftRef = useRef(note);
  const { canMutateNotes } = useViewport();
  const readOnly = !canMutateNotes;

  useEffect(() => {
    setDraft(note);
    setDirty(false);
    setTagInput('');
    dirtyRef.current = false;
    draftRef.current = note;
  }, [note?.id]);

  useEffect(() => {
    draftRef.current = { ...draft, body: draftRef.current.body };
  }, [draft]);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const mutate = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
  };

  const handleBodyChange = (html) => {
    draftRef.current = { ...draftRef.current, body: html };
    dirtyRef.current = true;
    setDirty(true);
  };

  // ---- tags ----
  const addTag = () => {
    const raw = tagInput.trim().replace(/^#/, '');
    if (!raw) return;
    const current = draft.tags ?? [];
    if (current.includes(raw)) {
      setTagInput('');
      return;
    }
    mutate({ tags: [...current, raw] });
    setTagInput('');
  };
  const removeTag = (t) =>
    mutate({ tags: (draft.tags ?? []).filter((x) => x !== t) });

  // ---- save ----
  const saveIfNeeded = async () => {
    if (readOnly) return;
    const current = draftRef.current;
    if (!dirtyRef.current) return;
    if (!noteHasContent(current)) return;
    await onSave({ ...current, title: (current.title ?? '').trim() });
  };

  useEffect(() => {
    return () => {
      saveIfNeeded();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = async () => {
    await saveIfNeeded();
    onBack();
  };

  const handleDelete = () => {
    if (!confirm('이 노트를 삭제할까요?')) return;
    dirtyRef.current = false;
    onDelete?.(draft);
  };

  const folderOptions = useMemo(
    () => [
      { value: '', label: '분류 없음' },
      ...folders.map((f) => ({ value: f.id, label: f.name })),
    ],
    [folders],
  );

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-6"
      style={{ animation: 'dsPageIn 260ms var(--ease-emphasis)' }}
    >
      <div className="flex items-center gap-2">
        <IconButton icon={ArrowLeft} size="md" variant="clear" ariaLabel="뒤로" onClick={handleBack} />
        <div className="t-caption flex-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
          Notes / {folderLabel}
        </div>
        {!readOnly && (
          <>
            <IconButton
              icon={Pin}
              size="md"
              variant={draft.pinned ? 'brand' : 'clear'}
              ariaLabel={draft.pinned ? '고정 해제' : '고정'}
              onClick={() => mutate({ pinned: !draft.pinned })}
            />
            <IconButton
              icon={Trash2}
              size="md"
              variant="danger"
              ariaLabel="노트 삭제"
              onClick={handleDelete}
            />
          </>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <div style={{ minWidth: 220 }}>
            <FormSelect
              value={draft.folderId ?? ''}
              onChange={(v) => mutate({ folderId: v || null })}
              options={folderOptions}
              placeholder="분류 없음"
            />
          </div>
          <TagEditor
            tags={draft.tags ?? []}
            value={tagInput}
            onInput={setTagInput}
            onAdd={addTag}
            onRemove={removeTag}
          />
        </div>
      )}

      {readOnly && (draft.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full px-2 py-0.5 t-caption"
              style={{
                background: 'var(--surface-layered)',
                color: 'var(--text-secondary)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <AutoTextarea
        value={draft.title}
        onChange={(e) => mutate({ title: e.target.value.slice(0, TITLE_MAX) })}
        placeholder="제목"
        minRows={1}
        readOnly={readOnly}
        style={{
          fontSize: 32,
          lineHeight: '42px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      />

      <div
        className="border-t pt-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <BodyEditor
          key={note?.id ?? 'new'}
          initialHtml={note?.body ?? ''}
          readOnly={readOnly}
          onChange={handleBodyChange}
        />
      </div>

      {!readOnly && (
        <div
          className="t-caption px-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          입력 중 적용: <kbd style={kbdStyle}>#</kbd>{' '}
          <kbd style={kbdStyle}>##</kbd> <kbd style={kbdStyle}>###</kbd>{' '}
          <kbd style={kbdStyle}>-</kbd> <kbd style={kbdStyle}>1.</kbd>{' '}
          <kbd style={kbdStyle}>{'>'}</kbd> + Space ·{' '}
          <kbd style={kbdStyle}>```</kbd>+Enter 코드블록 ·{' '}
          <kbd style={kbdStyle}>---</kbd>+Enter 구분선 ·{' '}
          <kbd style={kbdStyle}>⌘B</kbd> 굵게 · <kbd style={kbdStyle}>⌘I</kbd> 기울임
        </div>
      )}
    </div>
  );
}

const kbdStyle = {
  background: 'var(--surface-layered)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 4,
  padding: '0 4px',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

// ---------------------------------------------------------------
// BodyEditor — single contenteditable surface.
//
// React doesn't control the DOM here; we set innerHTML once on mount
// and let the browser own selection/edits. onInput pushes the current
// HTML up to the parent through a ref so re-renders never blow away
// cursor position. Block-level markdown shortcuts trigger on Space
// (#, ##, ###, -, *, 1., >) and Enter (```code```, ---). Paste from
// Notion runs through the HTML sanitizer so bold/code/lists survive.
// ---------------------------------------------------------------
function BodyEditor({ initialHtml, readOnly, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = initialHtml || '';
    try {
      // Make Enter create <p> blocks instead of <div> on Chrome.
      document.execCommand('defaultParagraphSeparator', false, 'p');
    } catch {
      /* ignore — Firefox uses <br> by default which we also tolerate */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const handleInput = () => flush();

  const handlePaste = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const cd = e.clipboardData;
    const html = cd?.getData('text/html');
    const text = cd?.getData('text/plain') ?? '';
    const toInsert = html
      ? sanitizeHtml(html)
      : escapeHtml(text).replace(/\r?\n/g, '<br>');
    insertHtmlAtCursor(toInsert);
    flush();
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === ' ' && handleSpaceShortcut(e, ref.current)) {
      flush();
    } else if (e.key === 'Enter' && !e.shiftKey && handleEnterShortcut(e, ref.current)) {
      flush();
    }
  };

  return (
    <div
      ref={ref}
      className="note-body w-full outline-none"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      data-placeholder={readOnly ? '' : '내용을 입력하세요. 노션에서 그대로 복사·붙여넣기 가능합니다.'}
      style={{
        fontSize: 16,
        lineHeight: '26px',
        color: 'var(--text-primary)',
        minHeight: 240,
      }}
    />
  );
}

// ---- selection / DOM helpers -----------------------------------

function insertHtmlAtCursor(html) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const frag = tpl.content;
  const last = frag.lastChild;
  range.insertNode(frag);
  if (last) {
    const r = document.createRange();
    r.setStartAfter(last);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI', 'PRE',
]);

function findBlock(node, root) {
  let cur = node;
  while (cur && cur !== root) {
    if (cur.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has(cur.tagName)) return cur;
    cur = cur.parentNode;
  }
  return null;
}

function getTextBeforeCursor(block, range) {
  const r = range.cloneRange();
  r.setStart(block, 0);
  return r.toString();
}

function placeCursorAtStart(el) {
  const range = document.createRange();
  if (el.firstChild && el.firstChild.nodeType === Node.TEXT_NODE) {
    range.setStart(el.firstChild, 0);
  } else {
    range.setStart(el, 0);
  }
  range.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// ---- markdown shortcut handlers --------------------------------

const SPACE_RULES = [
  { match: '###', tag: 'h3' },
  { match: '##', tag: 'h2' },
  { match: '#', tag: 'h1' },
  { match: '-', tag: 'ul' },
  { match: '*', tag: 'ul' },
  { match: '1.', tag: 'ol' },
  { match: '>', tag: 'blockquote' },
];

function handleSpaceShortcut(e, root) {
  if (!root) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const block = findBlock(range.startContainer, root);
  if (!block) return false;
  // Only transform from a plain paragraph or div — never from inside an
  // existing heading/list/quote/code block.
  if (block.tagName !== 'P' && block.tagName !== 'DIV') return false;
  const before = getTextBeforeCursor(block, range);
  for (const rule of SPACE_RULES) {
    if (before === rule.match) {
      e.preventDefault();
      transformBlockTo(block, rule.tag);
      return true;
    }
  }
  return false;
}

function transformBlockTo(block, tag) {
  // Strip the leading marker characters from the block; whatever
  // follows the cursor (typically nothing, since shortcut fires on the
  // initial space) becomes the new block's content.
  const tail = block.textContent.replace(/^(#{1,3}|[-*]|1\.|>)\s*/, '');
  if (tag === 'ul' || tag === 'ol') {
    const list = document.createElement(tag);
    const li = document.createElement('li');
    li.textContent = tail;
    if (!tail) li.appendChild(document.createElement('br'));
    list.appendChild(li);
    block.replaceWith(list);
    placeCursorAtStart(li);
  } else {
    const next = document.createElement(tag);
    next.textContent = tail;
    if (!tail) next.appendChild(document.createElement('br'));
    block.replaceWith(next);
    placeCursorAtStart(next);
  }
}

function handleEnterShortcut(e, root) {
  if (!root) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const block = findBlock(range.startContainer, root);
  if (!block) return false;

  const text = block.textContent;

  // ``` on its own → start a code block
  if (block.tagName === 'P' && /^```\w*$/.test(text.trim())) {
    e.preventDefault();
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.appendChild(document.createElement('br'));
    pre.appendChild(code);
    block.replaceWith(pre);
    placeCursorAtStart(code);
    return true;
  }

  // --- on its own → horizontal rule, then a fresh paragraph below
  if (block.tagName === 'P' && /^-{3,}$/.test(text.trim())) {
    e.preventDefault();
    const hr = document.createElement('hr');
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));
    block.replaceWith(hr);
    hr.after(p);
    placeCursorAtStart(p);
    return true;
  }

  // Enter at end of an empty heading/quote → demote to paragraph
  const tag = block.tagName;
  const isHeading = tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6';
  if ((isHeading || tag === 'BLOCKQUOTE') && text.trim() === '') {
    e.preventDefault();
    const p = document.createElement('p');
    p.appendChild(document.createElement('br'));
    block.replaceWith(p);
    placeCursorAtStart(p);
    return true;
  }

  // Empty <li> at the end of a list → exit the list
  if (tag === 'LI' && text === '') {
    const list = block.parentElement;
    if (list && (list.tagName === 'UL' || list.tagName === 'OL')) {
      e.preventDefault();
      const p = document.createElement('p');
      p.appendChild(document.createElement('br'));
      list.after(p);
      block.remove();
      if (!list.children.length) list.remove();
      placeCursorAtStart(p);
      return true;
    }
  }

  return false;
}

// ---- tag editor ------------------------------------------------

function TagEditor({ tags, value, onInput, onAdd, onRemove }) {
  return (
    <div
      className="flex flex-1 flex-wrap items-center gap-1.5 rounded-md px-2 py-1.5"
      style={{ background: 'var(--surface-layered)' }}
    >
      {tags.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 t-caption"
          style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}
        >
          #{t}
          <button
            onClick={() => onRemove(t)}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label={`${t} 태그 제거`}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            onAdd();
          } else if (e.key === 'Backspace' && !value && tags.length) {
            onRemove(tags[tags.length - 1]);
          }
        }}
        placeholder={tags.length ? '태그 추가' : '#태그를 입력하고 Enter'}
        className="min-w-[120px] flex-1 bg-transparent outline-none t-caption"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  );
}
