-- Seed the activity catalog. Each song is exposed as two assignable activities:
--   song-N-play     (the DDR/Tap gameplay)        — type 'lesson'
--   song-N-practice (the karaoke / Practice mode) — type 'exercise'
-- Recall-break quizzes are sub-events recorded inside user_progress for the parent activity;
-- they're not separately assignable.

with songs as (
  select generate_series(1, 50) as n
)
insert into activity (id, title, type, song_number, mode)
select 'song-' || n || '-play',     'Song ' || n || ' — Play',     'lesson',   n, 'play'     from songs
union all
select 'song-' || n || '-practice', 'Song ' || n || ' — Practice', 'exercise', n, 'practice' from songs
on conflict (id) do nothing;
