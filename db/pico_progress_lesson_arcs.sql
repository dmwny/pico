alter table if exists public.pico_progress
  add column if not exists arc_progress jsonb not null default '{}'::jsonb;

alter table if exists public.pico_progress
  add column if not exists active_lesson_session jsonb;

comment on column public.pico_progress.arc_progress is
  'Per-node lesson arc progress keyed by nodeId. Tracks current lesson index, question index, hearts, earned XP, completed sub-lessons, and status.';

comment on column public.pico_progress.active_lesson_session is
  'Resumable in-flight lesson session payload for the current node, including authored question ids/order, hearts, attempts, and timestamps.';
