alter table if exists public.profiles
  add column if not exists total_xp integer default 0,
  add column if not exists weekly_xp integer default 0,
  add column if not exists league_tier varchar(20) default 'bronze',
  add column if not exists highest_league_tier varchar(20) default 'bronze',
  add column if not exists streak_days integer default 0,
  add column if not exists last_active_date date,
  add column if not exists last_heart_regen_at timestamptz default now(),
  add column if not exists hearts integer default 5,
  add column if not exists coins integer default 0,
  add column if not exists level integer default 1,
  add column if not exists unlocked_themes text[] default array['default']::text[],
  add column if not exists equipped_theme varchar(50) default 'default',
  add column if not exists active_power_ups jsonb default '[]'::jsonb,
  add column if not exists last_recap_shown date,
  add column if not exists comeback_bonus_claimed_at date,
  add column if not exists total_questions_answered integer default 0,
  add column if not exists total_correct_answers integer default 0,
  add column if not exists last_processed_week_number integer default 0;

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier varchar(20) not null default 'bronze',
  week_number integer not null,
  season_number integer not null default 1,
  opponents jsonb not null default '[]'::jsonb,
  user_xp_at_week_start integer not null default 0,
  promoted boolean,
  demoted boolean,
  final_rank integer,
  created_at timestamptz default now(),
  unique(user_id, week_number, season_number)
);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_date date not null,
  challenges jsonb not null default '[]'::jsonb,
  all_completed boolean default false,
  all_completed_streak integer default 0,
  unique(user_id, challenge_date)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  lesson_id text not null,
  course_id text not null,
  added_at timestamptz default now(),
  unique(user_id, question_id)
);

create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null,
  content text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id text not null,
  course_name text not null,
  language text not null,
  issued_at timestamptz default now(),
  unique(user_id, course_id)
);

create table if not exists public.boss_battles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  boss_id text not null,
  defeated boolean default false,
  attempts integer default 0,
  defeated_at timestamptz,
  cosmetic_dropped text,
  unique(user_id, boss_id)
);

create table if not exists public.topic_accuracy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null,
  questions_answered integer default 0,
  correct_answers integer default 0,
  last_answered_at timestamptz default now(),
  unique(user_id, topic_id)
);

alter table public.leagues enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.bookmarks enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.certifications enable row level security;
alter table public.boss_battles enable row level security;
alter table public.topic_accuracy enable row level security;

drop policy if exists "users manage own leagues" on public.leagues;
create policy "users manage own leagues"
on public.leagues
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own daily challenges" on public.daily_challenges;
create policy "users manage own daily challenges"
on public.daily_challenges
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own bookmarks" on public.bookmarks;
create policy "users manage own bookmarks"
on public.bookmarks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own notes" on public.lesson_notes;
create policy "users manage own notes"
on public.lesson_notes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own certifications" on public.certifications;
create policy "users manage own certifications"
on public.certifications
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own boss battles" on public.boss_battles;
create policy "users manage own boss battles"
on public.boss_battles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users manage own topic accuracy" on public.topic_accuracy;
create policy "users manage own topic accuracy"
on public.topic_accuracy
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
