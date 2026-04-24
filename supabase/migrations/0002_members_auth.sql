-- 908doha Workspace — member password auth + task authorship
-- Extends 0001_init.sql. Apply via Supabase Dashboard → SQL Editor.
-- Idempotent: safe to re-run.

-- =============================================================
-- Members: password auth columns
-- PBKDF2-SHA256 600,000 iterations, 256-bit output, 16-byte salt.
-- Both stored as base64. Verification derives again and compares.
-- =============================================================

alter table public.members
  add column if not exists pw_salt text,
  add column if not exists pw_hash text;

-- =============================================================
-- Tasks: creator / last editor attribution
-- Points at members.id; ON DELETE SET NULL keeps history readable
-- if a member is removed later.
-- =============================================================

alter table public.tasks
  add column if not exists created_by text
    references public.members(id) on delete set null,
  add column if not exists updated_by text
    references public.members(id) on delete set null;

create index if not exists tasks_created_by_idx on public.tasks (created_by);
create index if not exists tasks_updated_by_idx on public.tasks (updated_by);
