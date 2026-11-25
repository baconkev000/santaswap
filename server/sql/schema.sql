-- SantaSwap schema for Render Postgres (no Supabase auth / RLS).
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create type exchange_status as enum (
    'draft',
    'ready_to_draw',
    'drawn',
    'sending',
    'complete'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type double_gift_budget_mode as enum ('full', 'split');
exception when duplicate_object then null;
end $$;

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references users (id) on delete cascade,
  name text not null,
  exchange_date text,
  minimum_budget numeric,
  maximum_budget numeric,
  organizer_participates boolean not null default true,
  organizer_can_see_assignments boolean not null default false,
  prevent_subgroup_matches boolean not null default false,
  allow_double_gifts boolean not null default false,
  double_gift_budget_mode double_gift_budget_mode not null default 'full',
  status exchange_status not null default 'draft',
  invite_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_organizer_id_idx on groups (organizer_id);

create or replace function generate_group_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  code text;
  i int;
begin
  loop
    bytes := gen_random_bytes(10);
    code := '';
    for i in 0..9 loop
      code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (
      select 1 from groups g where g.invite_code = code
    );
  end loop;
  return code;
end;
$$;

create or replace function set_group_invite_code()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.invite_code := generate_group_invite_code();
  else
    new.invite_code := old.invite_code;
  end if;
  return new;
end;
$$;

drop trigger if exists groups_set_invite_code on groups;
create trigger groups_set_invite_code
  before insert or update on groups
  for each row execute function set_group_invite_code();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'groups_invite_code_unique'
  ) then
    -- Backfill any rows missing a code before enforcing constraints.
    update groups set invite_code = generate_group_invite_code() where invite_code is null;
    alter table groups alter column invite_code set not null;
    alter table groups add constraint groups_invite_code_unique unique (invite_code);
    alter table groups add constraint groups_invite_code_format
      check (invite_code ~ '^[A-HJ-NP-Z2-9]{10}$');
  end if;
end $$;

create table if not exists subgroups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists subgroups_group_id_idx on subgroups (group_id);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  name text not null,
  phone_number text not null,
  phone_normalized text not null,
  email text,
  subgroup_id uuid references subgroups (id) on delete set null,
  is_organizer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participants_phone_normalized_unique unique (group_id, phone_normalized)
);

create index if not exists participants_group_id_idx on participants (group_id);
create index if not exists participants_subgroup_id_idx on participants (subgroup_id);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  giver_id uuid not null references participants (id) on delete cascade,
  recipient_id uuid not null references participants (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint assignments_no_self check (giver_id <> recipient_id)
);

create index if not exists assignments_group_id_idx on assignments (group_id);
create index if not exists assignments_giver_id_idx on assignments (giver_id);
create index if not exists assignments_recipient_id_idx on assignments (recipient_id);

create table if not exists assignment_reveal_attempts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups (id) on delete cascade,
  phone_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists assignment_reveal_group_phone_idx
  on assignment_reveal_attempts (group_id, phone_hash, created_at desc);
create index if not exists assignment_reveal_phone_idx
  on assignment_reveal_attempts (phone_hash, created_at desc);
create index if not exists assignment_reveal_created_idx
  on assignment_reveal_attempts (created_at);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

drop trigger if exists groups_set_updated_at on groups;
create trigger groups_set_updated_at
  before update on groups
  for each row execute function set_updated_at();

drop trigger if exists participants_set_updated_at on participants;
create trigger participants_set_updated_at
  before update on participants
  for each row execute function set_updated_at();
