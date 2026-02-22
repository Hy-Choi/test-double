-- TwoLineLyrics (두줄자막) MVP schema
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  chorus_first_line text not null,
  verse1_first_line text not null,
  two_line_units jsonb not null check (jsonb_typeof(two_line_units) = 'array'),
  lyrics_full text,
  copyright_holder text,
  ccli_number text,
  tags text[],
  created_at timestamptz not null default now()
);

create index if not exists songs_created_at_idx on songs (created_at desc);
create index if not exists songs_title_lower_idx on songs ((lower(title)));
create index if not exists songs_chorus_lower_idx on songs ((lower(chorus_first_line)));
create index if not exists songs_verse1_lower_idx on songs ((lower(verse1_first_line)));

create table if not exists search_weight_config (
  id uuid primary key default gen_random_uuid(),
  title_exact int not null default 100,
  title_partial int not null default 60,
  chorus_weight int not null default 55,
  verse1_weight int not null default 45,
  lyrics_weight int not null default 20,
  unit_weight int not null default 15,
  fuzzy_weight int not null default 10,
  updated_at timestamptz not null default now()
);

create or replace function set_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_search_weight_updated_at on search_weight_config;
create trigger trg_search_weight_updated_at
before update on search_weight_config
for each row execute procedure set_timestamp_updated_at();

insert into search_weight_config (
  title_exact,
  title_partial,
  chorus_weight,
  verse1_weight,
  lyrics_weight,
  unit_weight,
  fuzzy_weight
)
select 100, 60, 55, 45, 20, 15, 10
where not exists (select 1 from search_weight_config);

-- MVP has no authentication.
alter table songs disable row level security;
alter table search_weight_config disable row level security;
