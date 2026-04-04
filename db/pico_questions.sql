create table if not exists public.pico_questions (
  id text primary key,
  language text not null,
  concept_slug text not null,
  concept text not null,
  type text not null check (
    type in (
      'mc_concept',
      'mc_output',
      'word_bank',
      'arrange',
      'fill_type',
      'fill_select',
      'spot_bug',
      'predict_type',
      'match_pairs',
      'true_false',
      'complete_fn',
      'debug'
    )
  ),
  difficulty smallint not null check (difficulty between 1 and 5),
  prompt text not null,
  code text,
  options jsonb,
  correct_index integer,
  correct_answer text,
  pairs jsonb,
  tokens jsonb,
  correct_tokens jsonb,
  lines jsonb,
  correct_order jsonb,
  bug_line integer,
  test_cases jsonb,
  explanation text not null,
  hint text,
  xp_bonus integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists pico_questions_lookup_idx
  on public.pico_questions (language, concept_slug, difficulty);

create index if not exists pico_questions_type_idx
  on public.pico_questions (type);

comment on table public.pico_questions is
  'Authored lesson-arc question bank for Duolingo-style coding lessons. The application currently ships with a local authored Python for loops seed bank and can read mirrored content from this table.';
