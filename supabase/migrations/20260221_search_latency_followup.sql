-- Search latency follow-up (prepared SQL only; do not auto-apply in this change set)
-- Rollout order:
-- 1) Deploy code-level optimization first (debounce/includeSuggestions/candidate limit split).
-- 2) Apply this migration in Supabase when operational window is ready.

create extension if not exists pg_trgm;

create or replace function public.search_song_candidates(
  query_text text,
  candidate_limit int default 800
)
returns table (
  id uuid,
  title text,
  artist text,
  chorus_first_line text,
  verse1_first_line text,
  two_line_units jsonb,
  lyrics_full text,
  copyright_holder text,
  ccli_number text,
  tags text[],
  created_at timestamptz
)
language sql
stable
as $$
  with params as (
    select
      lower(trim(coalesce(query_text, ''))) as q,
      greatest(1, least(coalesce(candidate_limit, 800), 2000)) as lim
  ),
  contains_match as (
    select
      s.*,
      0 as bucket
    from songs s
    cross join params p
    where p.q <> ''
      and (
        lower(s.title) like '%' || p.q || '%'
        or lower(coalesce(s.artist, '')) like '%' || p.q || '%'
        or lower(coalesce(array_to_string(s.tags, ' '), '')) like '%' || p.q || '%'
        or lower(s.chorus_first_line) like '%' || p.q || '%'
        or lower(s.verse1_first_line) like '%' || p.q || '%'
        or (
          char_length(p.q) >= 2
          and (
            lower(coalesce(s.lyrics_full, '')) like '%' || p.q || '%'
            or lower(coalesce(s.two_line_units::text, '')) like '%' || p.q || '%'
          )
        )
      )
    order by s.created_at desc
    limit greatest((select lim from params), 300)
  ),
  fuzzy_title_match as (
    select
      s.*,
      1 as bucket
    from songs s
    cross join params p
    where p.q <> ''
      and char_length(p.q) >= 2
      and lower(s.title) % p.q
    order by similarity(lower(s.title), p.q) desc, s.created_at desc
    limit greatest((select lim from params) / 2, 120)
  ),
  candidate_union as (
    select * from contains_match
    union
    select * from fuzzy_title_match
  )
  select
    c.id,
    c.title,
    c.artist,
    c.chorus_first_line,
    c.verse1_first_line,
    c.two_line_units,
    c.lyrics_full,
    c.copyright_holder,
    c.ccli_number,
    c.tags,
    c.created_at
  from candidate_union c
  cross join params p
  order by
    c.bucket asc,
    case
      when lower(c.title) = p.q then 0
      when lower(c.title) like p.q || '%' then 1
      when lower(c.title) like '%' || p.q || '%' then 2
      else 3
    end,
    similarity(lower(c.title), p.q) desc,
    c.created_at desc
  limit (select lim from params);
$$;

comment on function public.search_song_candidates(text, int)
  is 'Prepared follow-up for search latency. Apply after code rollout.';
