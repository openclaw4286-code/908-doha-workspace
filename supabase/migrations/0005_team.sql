-- 908doha Workspace — team profiles + work logs
-- Apply via Supabase Dashboard → SQL Editor. Idempotent.

-- =============================================================
-- Member profile fields surfaced on the Team page
-- =============================================================

alter table public.members
  add column if not exists role    text,
  add column if not exists bio     text,
  add column if not exists contact text;

-- =============================================================
-- Work time tracking (출근/퇴근 기록)
-- One row per session. ended_at NULL means the member is on the
-- clock right now.
-- =============================================================

create table if not exists public.work_logs (
  id         text primary key,
  member_id  text not null references public.members(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists work_logs_member_idx  on public.work_logs (member_id);
create index if not exists work_logs_started_idx on public.work_logs (started_at desc);
create index if not exists work_logs_open_idx
  on public.work_logs (member_id) where ended_at is null;

alter table public.work_logs enable row level security;

do $$
begin
  execute 'drop policy if exists work_logs_anon_all on public.work_logs';
  execute 'drop policy if exists work_logs_auth_all on public.work_logs';
  execute 'create policy work_logs_anon_all on public.work_logs for all to anon using (true) with check (true)';
  execute 'create policy work_logs_auth_all on public.work_logs for all to authenticated using (true) with check (true)';
end $$;
