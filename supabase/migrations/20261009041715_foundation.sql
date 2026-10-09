-- Milestone 1 — foundation: shared helpers and the User profile (spec §2, §12.1).

create extension if not exists pg_trgm with schema extensions;

-- Internal helpers live outside the exposed `public` schema, so they are not callable through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keeps modified_at current on every update (`AUD-1`).
create function private.set_modified_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modified_at := now();
  return new;
end;
$$;

-- Current version of the app-level Terms of Use (`ACC-1`). Keep in sync with APP_TERMS_VERSION in src/data/profile.ts.
create function private.app_terms_version()
returns integer
language sql
immutable
set search_path = ''
as $$ select 1 $$;

-- User (`ACC-1`, `UGC-2`). One row per auth user; created by trigger, never by clients.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique
    constraint profiles_username_format check (username ~ '^[a-z0-9_.]{3,30}$'),
  age_confirmed_at timestamptz,
  app_terms_accepted_version integer,
  suspended boolean not null default false,
  suspension_reason text,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create trigger profiles_set_modified_at
  before update on public.profiles
  for each row execute function private.set_modified_at();

alter table public.profiles enable row level security;

-- Clients may read their own profile and change only the onboarding fields;
-- `suspended` / `suspension_reason` are set by the developer only (`UGC-2`).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (username, age_confirmed_at, app_terms_accepted_version) on public.profiles to authenticated;

create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Creates the profile row for every new auth user.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
