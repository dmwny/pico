create table if not exists arc_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  language text not null,
  node_id text not null,
  concept text not null,
  lesson_index integer not null default 0,
  completed_lessons jsonb not null default '[]',
  total_xp_earned integer not null default 0,
  is_complete boolean not null default false,
  last_updated_at timestamptz not null default now(),
  unique(user_id, language, node_id)
);

alter table arc_progress enable row level security;

create policy "users can manage own arc progress"
on arc_progress
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
