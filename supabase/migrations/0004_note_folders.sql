-- 908doha Workspace — folders for notes.
-- Extends 0001_init.sql. Apply via Supabase Dashboard → SQL Editor.
-- Idempotent: safe to re-run.

-- =============================================================
-- note_folders (flat, single-level categories)
-- =============================================================

create table if not exists public.note_folders (
  id         text primary key,
  name       text not null check (char_length(name) <= 40),
  created_at timestamptz not null default now()
);

-- =============================================================
-- notes.folder_id — nullable pointer, unfiled notes stay as NULL.
-- ON DELETE SET NULL so removing a folder doesn't cascade-delete notes.
-- =============================================================

alter table public.notes
  add column if not exists folder_id text
    references public.note_folders(id) on delete set null;

create index if not exists notes_folder_idx on public.notes (folder_id);

-- =============================================================
-- RLS parity with the rest of the workspace tables (anon-open for v1).
-- =============================================================

alter table public.note_folders enable row level security;

do $$
begin
  execute 'drop policy if exists note_folders_anon_all on public.note_folders';
  execute 'drop policy if exists note_folders_auth_all on public.note_folders';
  execute 'create policy note_folders_anon_all on public.note_folders for all to anon using (true) with check (true)';
  execute 'create policy note_folders_auth_all on public.note_folders for all to authenticated using (true) with check (true)';
end $$;
