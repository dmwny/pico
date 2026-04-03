create table if not exists public.pico_cosmetics (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.pico_cosmetics enable row level security;

drop policy if exists "Users can view own cosmetics" on public.pico_cosmetics;
create policy "Users can view own cosmetics"
on public.pico_cosmetics
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cosmetics" on public.pico_cosmetics;
create policy "Users can insert own cosmetics"
on public.pico_cosmetics
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own cosmetics" on public.pico_cosmetics;
create policy "Users can update own cosmetics"
on public.pico_cosmetics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
