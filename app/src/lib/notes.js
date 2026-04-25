// Note CRUD backed by Supabase. The note body is sanitized HTML
// rendered inside a contenteditable surface (single WYSIWYG view —
// editing IS the preview). To stay compatible with the existing
// `blocks` jsonb column the body is persisted as a single record
// `[{id, type:'html', text:<html>}]`. Older formats (`md`, legacy
// typed blocks) are migrated to HTML on read.

import { supabase } from './supabase.js';
import { uid } from './id.js';
import { escapeHtml, htmlToText } from './htmlSanitize.js';
import { markdownToHtml } from './markdown.js';

export function emptyNote(overrides = {}) {
  return {
    id: uid(),
    title: '',
    body: '',
    tags: [],
    pinned: false,
    folderId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function legacyBlockToHtml(b) {
  const text = escapeHtml(b.text ?? '');
  switch (b.type) {
    case 'h1': return `<h1>${text}</h1>`;
    case 'h2': return `<h2>${text}</h2>`;
    case 'h3': return `<h3>${text}</h3>`;
    case 'heading': return `<h2>${text}</h2>`;
    case 'bullet': return `<ul><li>${text}</li></ul>`;
    case 'numbered': return `<ol><li>${text}</li></ol>`;
    case 'check': return `<p>${b.checked ? '☑' : '☐'} ${text}</p>`;
    case 'quote': return `<blockquote>${text}</blockquote>`;
    case 'divider': return '<hr>';
    case 'text':
    default:
      return text ? `<p>${text}</p>` : '';
  }
}

function blocksToBody(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return '';
  if (blocks.length === 1) {
    const b = blocks[0];
    if (b?.type === 'html') return b.text ?? '';
    if (b?.type === 'md') return markdownToHtml(b.text ?? '');
  }
  return blocks
    .filter((b) => b && typeof b === 'object')
    .map(legacyBlockToHtml)
    .join('');
}

function bodyToBlocks(body) {
  return [{ id: uid(), type: 'html', text: body ?? '' }];
}

function rowToNote(r) {
  return {
    id: r.id,
    title: r.title ?? '',
    body: blocksToBody(Array.isArray(r.blocks) ? r.blocks : []),
    tags: Array.isArray(r.tags) ? r.tags : [],
    pinned: !!r.pinned,
    folderId: r.folder_id ?? null,
    createdBy: r.created_by ?? null,
    updatedBy: r.updated_by ?? null,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : null,
  };
}

function noteToRow(n) {
  return {
    id: n.id,
    title: n.title ?? '',
    blocks: bodyToBlocks(n.body ?? ''),
    tags: n.tags ?? [],
    pinned: !!n.pinned,
    folder_id: n.folderId ?? null,
    created_by: n.createdBy ?? null,
    updated_by: n.updatedBy ?? null,
  };
}

export async function listNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function upsertNote(note) {
  const { data, error } = await supabase
    .from('notes')
    .upsert(noteToRow(note))
    .select()
    .single();
  if (error) throw error;
  return rowToNote(data);
}

export async function removeNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) throw error;
}

export function snippet(note, max = 140) {
  const text = htmlToText(note.body ?? '');
  if (!text) return '';
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export function noteHasContent(n) {
  if ((n.title ?? '').trim()) return true;
  return htmlToText(n.body ?? '').length > 0;
}

export function noteBodyText(n) {
  return htmlToText(n.body ?? '');
}
