import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Bold, Code, Code2, Heading1, Heading2, Heading3,
  Italic, Link as LinkIcon, List, ListOrdered, Minus, Pin,
  Quote, Strikethrough, Trash2, X,
} from 'lucide-react';
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
  const bodyRef = useRef(null);
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

  const flushBodyFromDom = () => {
    if (bodyRef.current) handleBodyChange(bodyRef.current.innerHTML);
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
        className="border-t pt-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {!readOnly && (
          <Toolbar editorRef={bodyRef} onChanged={flushBodyFromDom} />
        )}
        <BodyEditor
          key={note?.id ?? 'new'}
          editorRef={bodyRef}
          initialHtml={note?.body ?? ''}
          readOnly={readOnly}
          onChange={handleBodyChange}
        />
      </div>
    </div>
  );
}

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
function BodyEditor({ editorRef, initialHtml, readOnly, onChange }) {
  useEffect(() => {
    const el = editorRef.current;
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
    if (editorRef.current) onChange(editorRef.current.innerHTML);
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
    if (e.key === ' ' && handleSpaceShortcut(e, editorRef.current)) {
      flush();
    } else if (e.key === 'Enter' && !e.shiftKey && handleEnterShortcut(e, editorRef.current)) {
      flush();
    }
  };

  return (
    <div
      ref={editorRef}
      className="note-body w-full outline-none"
      contentEditable={!readOnly}
      suppressContentEditableWarning
      spellCheck={false}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      data-placeholder={readOnly ? '' : '내용을 입력하거나 노션에서 그대로 복사·붙여넣어 주세요.'}
      style={{
        fontSize: 16,
        lineHeight: '26px',
        color: 'var(--text-primary)',
        minHeight: 240,
      }}
    />
  );
}

// ---------------------------------------------------------------
// Toolbar — sticky formatting bar above the editor.
//
// Buttons use mousedown.preventDefault so clicking them doesn't steal
// the editor's selection. Most actions go through document.execCommand
// (deprecated but universally supported and the simplest path for a
// small in-house editor); inline code and the code block are handled
// manually since the standard commands don't cover them.
// ---------------------------------------------------------------
function Toolbar({ editorRef, onChanged }) {
  const focus = () => editorRef.current?.focus();

  const exec = (cmd, value) => {
    focus();
    try {
      document.execCommand(cmd, false, value);
    } catch {
      /* ignore — execCommand is best-effort here */
    }
    onChanged();
  };

  const setBlock = (tag) => exec('formatBlock', tag.toUpperCase());

  const wrapInline = (tag) => {
    focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const wrapper = document.createElement(tag);
    try {
      range.surroundContents(wrapper);
    } catch {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
    }
    const r = document.createRange();
    r.selectNodeContents(wrapper);
    sel.removeAllRanges();
    sel.addRange(r);
    onChanged();
  };

  const insertCodeBlock = () => {
    focus();
    const sel = window.getSelection();
    const root = editorRef.current;
    if (!sel || sel.rangeCount === 0 || !root) return;
    const block = findBlock(sel.getRangeAt(0).startContainer, root);
    if (!block || block.tagName === 'PRE') return;
    const text = block.textContent ?? '';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    if (text) code.textContent = text;
    else code.appendChild(document.createElement('br'));
    pre.appendChild(code);
    block.replaceWith(pre);
    placeCursorAtStart(code);
    onChanged();
  };

  const insertLink = () => {
    const sel = window.getSelection();
    const hadSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed;
    const url = window.prompt('링크 URL을 입력하세요', 'https://');
    if (!url) return;
    focus();
    if (hadSelection) {
      exec('createLink', url);
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      insertNodeAtCursor(a);
      onChanged();
    }
  };

  const insertHr = () => exec('insertHorizontalRule');

  const noFocusSteal = (e) => e.preventDefault();

  return (
    <div
      onMouseDown={noFocusSteal}
      className="sticky top-0 z-10 mb-2 flex flex-wrap items-center gap-0.5 rounded-md px-1.5 py-1"
      style={{
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <ToolBtn icon={Heading1} label="제목 1" onClick={() => setBlock('h1')} />
      <ToolBtn icon={Heading2} label="제목 2" onClick={() => setBlock('h2')} />
      <ToolBtn icon={Heading3} label="제목 3" onClick={() => setBlock('h3')} />
      <Sep />
      <ToolBtn icon={Bold} label="굵게 (⌘B)" onClick={() => exec('bold')} />
      <ToolBtn icon={Italic} label="기울임 (⌘I)" onClick={() => exec('italic')} />
      <ToolBtn icon={Strikethrough} label="취소선" onClick={() => exec('strikeThrough')} />
      <ToolBtn icon={Code} label="인라인 코드" onClick={() => wrapInline('code')} />
      <Sep />
      <ToolBtn icon={List} label="글머리 목록" onClick={() => exec('insertUnorderedList')} />
      <ToolBtn icon={ListOrdered} label="번호 목록" onClick={() => exec('insertOrderedList')} />
      <ToolBtn icon={Quote} label="인용" onClick={() => setBlock('blockquote')} />
      <Sep />
      <ToolBtn icon={Code2} label="코드 블록" onClick={insertCodeBlock} />
      <ToolBtn icon={LinkIcon} label="링크" onClick={insertLink} />
      <ToolBtn icon={Minus} label="구분선" onClick={insertHr} />
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-layered)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}

function Sep() {
  return (
    <div
      className="mx-1 h-5 w-px"
      style={{ background: 'var(--border-subtle)' }}
    />
  );
}

function insertNodeAtCursor(node) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  const r = document.createRange();
  r.setStartAfter(node);
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
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
