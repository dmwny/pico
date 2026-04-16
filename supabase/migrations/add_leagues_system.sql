create table public.leagues (
  id serial primary key,
  name text not null unique,
  tier integer not null unique,
  promotion_cutoff integer not null default 10,
  demotion_cutoff integer not null default 5,
  color_hex text not null,
  icon_emoji text not null,
  bg_gradient_from text not null,
  bg_gradient_to text not null,
  perk_description text,
  hard_mode_unlocked boolean default false,
  animated_border boolean default false
);

insert into public.leagues
  (name, tier, promotion_cutoff, demotion_cutoff, color_hex, icon_emoji,
   bg_gradient_from, bg_gradient_to, perk_description, hard_mode_unlocked, animated_border)
values
  ('Bronze',   1,  10, 5, '#cd7f32', '🥉', '#fdf6ee', '#f5f0e8', null, false, false),
  ('Silver',   2,  10, 5, '#a8a9ad', '🥈', '#f4f4f6', '#ebebed', null, false, false),
  ('Gold',     3,  10, 5, '#ffd700', '🥇', '#fefce8', '#fef9c3', 'Custom profile themes unlocked', false, false),
  ('Sapphire', 4,  10, 5, '#0f52ba', '💎', '#eff6ff', '#dbeafe', null, false, false),
  ('Ruby',     5,  10, 5, '#e0115f', '❤️', '#fff1f2', '#ffe4e6', null, false, false),
  ('Emerald',  6,  10, 5, '#50c878', '💚', '#f0fdf4', '#dcfce7', 'Hard mode lessons unlocked (+50% XP)', true, false),
  ('Amethyst', 7,  10, 5, '#9b59b6', '💜', '#faf5ff', '#f3e8ff', null, false, false),
  ('Pearl',    8,  10, 5, '#b8a99a', '🤍', '#fafaf9', '#f5f5f4', null, false, false),
  ('Obsidian', 9,  10, 5, '#4b5563', '🖤', '#1f2937', '#111827', null, false, false),
  ('Diamond',  10, 0,  5, '#7dd3fc', '💠', '#f0f9ff', '#e0f2fe', 'Animated profile border + exclusive badge', false, true);

create table public.league_weeks (
  id uuid primary key default gen_random_uuid(),
  week_start timestamptz not null,
  week_end timestamptz not null,
  is_current boolean not null default false,
  modifier_type text check (modifier_type in
    ('normal','double_xp_lessons','speed_bonus','accuracy_matters','no_mistakes_bonus')),
  modifier_label text,
  modifier_description text,
  created_at timestamptz default now()
);

create unique index league_weeks_current_idx on public.league_weeks(is_current)
  where is_current = true;

create table public.league_groups (
  id uuid primary key default gen_random_uuid(),
  league_week_id uuid references public.league_weeks(id) on delete cascade,
  league_id integer references public.leagues(id),
  group_number integer not null,
  avg_daily_xp_bucket integer default 0,
  created_at timestamptz default now()
);

create table public.league_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  league_group_id uuid references public.league_groups(id) on delete cascade,
  league_week_id uuid references public.league_weeks(id) on delete cascade,
  league_id integer references public.leagues(id),
  xp_earned_this_week integer not null default 0,
  peak_rank_this_week integer,
  players_passed integer default 0,
  final_rank integer,
  promoted boolean default false,
  demoted boolean default false,
  stayed boolean default false,
  is_ghost boolean default false,
  rival_user_id uuid references public.profiles(id),
  promotion_protected boolean default false,
  placement_week integer default 0,
  xp_multiplier numeric(4,2) default 1.0,
  streak_shield_used boolean default false,
  joined_at timestamptz default now(),
  unique(user_id, league_week_id)
);

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,
  source text not null,
  lesson_id text,
  multiplier numeric(4,2) default 1.0,
  bonus_type text,
  created_at timestamptz default now()
);

create index xp_events_user_created on public.xp_events(user_id, created_at desc);

create table public.xp_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  snapshot_date date not null,
  xp_earned integer default 0,
  cumulative_weekly_xp integer default 0,
  unique(user_id, snapshot_date)
);

create table public.league_missions (
  id uuid primary key default gen_random_uuid(),
  league_week_id uuid references public.league_weeks(id),
  title text not null,
  description text not null,
  xp_reward integer not null,
  mission_type text not null check (mission_type in
    ('earn_xp','finish_rank','complete_lessons','maintain_streak',
     'accuracy_streak','comeback','perfect_week')),
  target_value integer not null,
  league_min_tier integer default 1
);

create table public.user_mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  mission_id uuid references public.league_missions(id) on delete cascade,
  current_value integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  reward_claimed boolean default false,
  unique(user_id, mission_id)
);

create table public.league_reward_chests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  league_week_id uuid references public.league_weeks(id),
  league_id integer references public.leagues(id),
  final_rank integer,
  chest_tier text check (chest_tier in ('bronze','silver','gold','platinum','diamond')),
  xp_reward integer default 0,
  multiplier_reward numeric(4,2),
  multiplier_duration_days integer,
  streak_shield boolean default false,
  cosmetic_item text,
  opened boolean default false,
  opened_at timestamptz,
  created_at timestamptz default now()
);

create table public.hot_streak_multipliers (
  user_id uuid references public.profiles(id) primary key,
  consecutive_days integer default 0,
  current_multiplier numeric(4,2) default 1.0,
  last_active_date date,
  updated_at timestamptz default now()
);

create table public.overtake_events (
  id uuid primary key default gen_random_uuid(),
  overtaker_user_id uuid references public.profiles(id),
  overtaken_user_id uuid references public.profiles(id),
  league_group_id uuid references public.league_groups(id),
  xp_at_overtake integer,
  is_clutch boolean default false,
  created_at timestamptz default now()
);

create table public.diamond_tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage text not null check (stage in ('quarterfinal','semifinal','final')),
  started_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean default true
);

create table public.diamond_tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references public.diamond_tournaments(id),
  user_id uuid references public.profiles(id),
  xp_earned integer default 0,
  eliminated boolean default false,
  advanced boolean default false,
  winner boolean default false,
  badge_awarded boolean default false
);

create table public.xp_leaderboard_cache (
  user_id uuid references public.profiles(id) primary key,
  username text,
  avatar_url text,
  total_xp integer default 0,
  weekly_xp integer default 0,
  daily_xp integer default 0,
  current_streak integer default 0,
  league_id integer references public.leagues(id),
  play_style_tag text,
  updated_at timestamptz default now()
);

create table public.week_recap_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  league_week_id uuid references public.league_weeks(id),
  xp_earned integer default 0,
  players_passed integer default 0,
  peak_rank integer,
  final_rank integer,
  missions_completed integer default 0,
  result text check (result in ('promoted','demoted','stayed')),
  league_id integer,
  league_name text,
  created_at timestamptz default now()
);

alter table public.leagues enable row level security;
alter table public.league_weeks enable row level security;
alter table public.league_groups enable row level security;
alter table public.league_memberships enable row level security;
alter table public.xp_events enable row level security;
alter table public.xp_daily_snapshots enable row level security;
alter table public.league_missions enable row level security;
alter table public.user_mission_progress enable row level security;
alter table public.league_reward_chests enable row level security;
alter table public.hot_streak_multipliers enable row level security;
alter table public.overtake_events enable row level security;
alter table public.xp_leaderboard_cache enable row level security;
alter table public.week_recap_snapshots enable row level security;

create policy "public_read" on public.leagues for select using (true);
create policy "public_read" on public.league_weeks for select using (true);
create policy "public_read" on public.league_groups for select using (true);
create policy "public_read" on public.xp_leaderboard_cache for select using (true);
create policy "public_read" on public.league_missions for select using (true);

create policy "read_own_group" on public.league_memberships
  for select using (
    league_group_id in (
      select league_group_id from public.league_memberships
      where user_id = auth.uid()
    )
  );

create policy "own_data" on public.xp_events
  for select using (user_id = auth.uid());
create policy "own_data" on public.xp_daily_snapshots
  for select using (user_id = auth.uid());
create policy "own_data" on public.user_mission_progress
  for select using (user_id = auth.uid());
create policy "own_data" on public.league_reward_chests
  for select using (user_id = auth.uid());
create policy "own_data" on public.hot_streak_multipliers
  for select using (user_id = auth.uid());
create policy "own_data" on public.overtake_events
  for select using (
    overtaker_user_id = auth.uid() or overtaken_user_id = auth.uid()
  );
create policy "own_data" on public.week_recap_snapshots
  for select using (user_id = auth.uid());

create policy "own_update" on public.user_mission_progress
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own_update" on public.league_reward_chests
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "service_write" on public.league_memberships
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.xp_leaderboard_cache
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.hot_streak_multipliers
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.overtake_events
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.week_recap_snapshots
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.league_reward_chests
  for all using (auth.role() = 'service_role');
create policy "service_write" on public.xp_daily_snapshots
  for all using (auth.role() = 'service_role');

create or replace view public.current_group_leaderboard as
  select
    lm.user_id,
    lm.xp_earned_this_week,
    lm.league_group_id,
    lm.rival_user_id,
    lm.is_ghost,
    lm.xp_multiplier,
    p.username,
    p.avatar_url,
    rank() over (
      partition by lm.league_group_id
      order by lm.xp_earned_this_week desc
    ) as rank_in_group
  from public.league_memberships lm
  join public.profiles p on p.id = lm.user_id
  join public.league_weeks lw on lw.id = lm.league_week_id
  where lw.is_current = true;
