-- 908doha Workspace — initial schema (v0.3)
-- Apply via Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Idempotent: safe to re-run.

-- =============================================================
-- Tables
-- =============================================================

-- Tasks (spec 5.1)
create table if not exists public.tasks (
  id           text primary key,
  title        text not null check (char_length(title) <= 100),
  description  text not null default '' check (char_length(description) <= 1000),
  status       text not null default 'todo'
                 check (status in ('todo','doing','review','done')),
  priority     text not null default 'mid'
                 check (priority in ('high','mid','low')),
  assignee     text,
  due_date     date,
  attachments  jsonb not null default '[]'::jsonb,
  linked_notes jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists tasks_status_idx  on public.tasks (status);
create index if not exists tasks_created_idx on public.tasks (created_at desc);

-- Members (spec 5.2)
create table if not exists public.members (
  id         text primary key,
  name       text not null check (char_length(name) <= 20),
  color      text not null,
  created_at timestamptz not null default now()
);

-- Notes (spec 5.4)
create table if not exists public.notes (
  id         text primary key,
  title      text not null default '',
  blocks     jsonb not null default '[]'::jsonb,
  tags       text[] not null default '{}',
  pinned     boolean not null default false,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_pinned_updated_idx on public.notes (pinned desc, updated_at desc);

-- Files (spec 5.3)
create table if not exists public.files (
  id             text primary key,
  name           text not null,
  size           bigint not null default 0,
  mime_type      text not null default 'application/octet-stream',
  storage        text not null default 'base64'
                   check (storage in ('base64','gdrive','s3')),
  ref            text not null,
  uploader_id    text,
  linked_task_id text references public.tasks(id) on delete set null,
  linked_note_id text references public.notes(id) on delete set null,
  uploaded_at    timestamptz not null default now()
);

-- Vault — single encrypted blob (spec 5.6)
create table if not exists public.vault (
  id         smallint primary key check (id = 1),
  salt       text not null,
  iv         text not null,
  ciphertext text not null,
  version    smallint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- =============================================================
-- Triggers: keep updated_at fresh
-- =============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

drop trigger if exists vault_set_updated_at on public.vault;
create trigger vault_set_updated_at before update on public.vault
  for each row execute function public.set_updated_at();

-- =============================================================
-- Row Level Security
-- v0.3: open to anon (internal tool, no auth yet).
-- Vault contents are client-side encrypted so the blob is safe even
-- under open read. Replace with scoped policies when auth is added.
-- =============================================================

alter table public.tasks   enable row level security;
alter table public.members enable row level security;
alter table public.notes   enable row level security;
alter table public.files   enable row level security;
alter table public.vault   enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['tasks','members','notes','files','vault']
  loop
    execute format('drop policy if exists %I_anon_all on public.%I', t, t);
    execute format('drop policy if exists %I_auth_all on public.%I', t, t);
    execute format(
      'create policy %I_anon_all on public.%I for all to anon using (true) with check (true)',
      t, t);
    execute format(
      'create policy %I_auth_all on public.%I for all to authenticated using (true) with check (true)',
      t, t);
  end loop;
end $$;
