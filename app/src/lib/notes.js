// Note CRUD backed by Supabase. Blocks are stored as a jsonb array
// of `{id, type, text, checked?}` records; the UI treats one block as
// one rendered row so edits stay local without re-splitting strings.
//
// Block types ("Notion-style"):
//   text, h1, h2, h3, bullet, numbered, todo, quote, divider, callout
// Legacy values are normalized on read:
//   heading -> h2, check -> todo

import { supabase } from './supabase.js';
import { uid } from './id.js';

export const BLOCK_TYPES = [
  'text',
  'h1',
  'h2',
  'h3',
  'bullet',
  'numbered',
  'todo',
  'quote',
  'divider',
  'callout',
];

const LEGACY_MAP = { heading: 'h2', check: 'todo' };

export function normalizeType(type) {
  if (!type) return 'text';
  if (LEGACY_MAP[type]) return LEGACY_MAP[type];
  return BLOCK_TYPES.includes(type) ? type : 'text';
}

export function emptyBlock(type = 'text') {
  const t = normalizeType(type);
  const base = { id: uid(), type: t, text: '' };
  if (t === 'todo') return { ...base, checked: false };
  return base;
}

function normalizeBlock(b) {
  const type = normalizeType(b?.type);
  const out = { id: b?.id ?? uid(), type, text: b?.text ?? '' };
  if (type === 'todo') out.checked = !!b?.checked;
  return out;
}

export function emptyNote(overrides = {}) {
  return {
    id: uid(),
    title: '',
    blocks: [emptyBlock('text')],
    tags: [],
    pinned: false,
    folderId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

function rowToNote(r) {
  return {
    id: r.id,
    title: r.title ?? '',
    blocks: Array.isArray(r.blocks) ? r.blocks.map(normalizeBlock) : [],
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
    blocks: (n.blocks ?? [])
      .map(normalizeBlock)
      .filter(
        (b) =>
          b.type === 'todo' ||
          b.type === 'divider' ||
          (b.text ?? '').trim().length > 0,
      ),
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
  const parts = [];
  for (const b of note.blocks ?? []) {
    const type = normalizeType(b.type);
    if (type === 'divider') {
      parts.push('—');
      continue;
    }
    const text = (b.text ?? '').trim();
    if (!text) continue;
    if (type === 'todo') parts.push(`${b.checked ? '☑' : '☐'} ${text}`);
    else if (type === 'bullet') parts.push(`• ${text}`);
    else if (type === 'numbered') parts.push(`1. ${text}`);
    else if (type === 'quote') parts.push(`" ${text} "`);
    else parts.push(text);
    if (parts.join(' · ').length > max) break;
  }
  const joined = parts.join(' · ');
  return joined.length > max ? joined.slice(0, max - 1) + '…' : joined;
}
