-- 908doha Workspace — multi-assignee support for tasks
-- Extends 0001_init.sql / 0002_members_auth.sql. Apply via Supabase
-- Dashboard → SQL Editor. Idempotent: safe to re-run.

-- =============================================================
-- Tasks: assignees as a member-id array
-- Keeps the legacy scalar `assignee` column in place so older rows
-- and clients keep working; new writes target `assignees` only.
-- Seeds existing rows whose legacy `assignee` matches a member name
-- so the board doesn't lose attribution after the cutover.
-- =============================================================

alter table public.tasks
  add column if not exists assignees text[] not null default '{}';

-- Backfill: map legacy `assignee` text → member id(s) where it
-- matches a member name exactly. Leaves unmatched legacy values
-- alone (they'll still render from the scalar column on old cards).
update public.tasks t
   set assignees = array[m.id]
  from public.members m
 where t.assignee is not null
   and t.assignee = m.name
   and (t.assignees = '{}' or t.assignees is null);

create index if not exists tasks_assignees_idx
  on public.tasks using gin (assignees);
