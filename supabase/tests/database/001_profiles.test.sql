-- Profiles: creation, privacy and protected fields (`ACC-1`, `UGC-2`, `PRIV-1`).
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'bob@example.com');

select is(
  (select count(*)::int from public.profiles),
  2,
  'ACC-1: a profile row is created for every new auth user'
);

-- Act as Alice.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is(
  (select count(*)::int from public.profiles),
  1,
  'PRIV-1: a user sees only their own profile'
);

update public.profiles
  set username = 'alice', age_confirmed_at = now(), app_terms_accepted_version = 1
  where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select username from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'alice',
  'ACC-1: a user completes onboarding on their own profile'
);

update public.profiles set username = 'mallory' where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select username from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  null,
  'PRIV-1: a user cannot change another user''s profile'
);
set local role authenticated;

select throws_ok(
  $$ update public.profiles set suspended = false where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',
  null,
  'UGC-2: a user cannot change their own suspension'
);

select throws_ok(
  $$ insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333') $$,
  '42501',
  null,
  'ACC-1: clients cannot insert profiles directly'
);

select throws_ok(
  $$ update public.profiles set username = 'Bad Name!' where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514',
  null,
  'ACC-1: usernames are 3–30 lowercase letters, digits, "_" or "."'
);

-- Act as Bob: usernames are unique.
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$ update public.profiles set username = 'alice' where id = '22222222-2222-2222-2222-222222222222' $$,
  '23505',
  null,
  'ACC-1: usernames are unique'
);

-- Anonymous visitors see no profiles at all.
set local role anon;
select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'MEM-2: anonymous visitors cannot read profiles'
);

select * from finish();
rollback;
