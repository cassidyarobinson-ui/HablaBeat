-- HablaBeat backend: users, classes, memberships, activities, progress, assignments.
-- Permissions enforced via Postgres RLS so the data layer is the source of truth.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists app_user (
  id           uuid primary key default gen_random_uuid(),
  auth_id      uuid unique not null,                          -- references auth.users.id
  display_name text not null,
  email        text not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists class (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references app_user(id) on delete cascade,
  join_code  text not null unique,                             -- 6 chars, regenerable
  created_at timestamptz not null default now()
);
create index if not exists class_owner_idx on class(owner_id);

do $$ begin
  create type membership_role as enum ('student', 'teacher');
exception when duplicate_object then null; end $$;

create table if not exists membership (
  user_id   uuid not null references app_user(id) on delete cascade,
  class_id  uuid not null references class(id) on delete cascade,
  role      membership_role not null,
  joined_at timestamptz not null default now(),
  primary key (user_id, class_id)
);
create index if not exists membership_class_idx on membership(class_id);

do $$ begin
  create type activity_type as enum ('lesson', 'quiz', 'exercise');
exception when duplicate_object then null; end $$;

-- Activity is content-team owned. Seed once, treat as immutable from app code.
create table if not exists activity (
  id          text primary key,                                -- e.g. 'song-4-play'
  title       text not null,
  type        activity_type not null,
  song_number int,
  mode        text                                             -- 'play' | 'practice'
);

do $$ begin
  create type progress_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- Single source of truth for progress. Keyed only on (user, activity).
-- Never duplicated per class — teacher views are derived via membership join.
create table if not exists user_progress (
  user_id          uuid not null references app_user(id) on delete cascade,
  activity_id      text not null references activity(id),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  status           progress_status not null default 'not_started',
  score            int,
  xp               int not null default 0,
  last_updated     timestamptz not null default now(),
  primary key (user_id, activity_id)
);
create index if not exists user_progress_user_recent_idx on user_progress(user_id, last_updated desc);

create table if not exists assignment (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references class(id) on delete cascade,
  title      text not null,
  due_at     timestamptz,
  created_by uuid not null references app_user(id),
  created_at timestamptz not null default now()
);
create index if not exists assignment_class_idx on assignment(class_id, due_at);

create table if not exists assignment_activity (
  assignment_id uuid not null references assignment(id) on delete cascade,
  activity_id   text not null references activity(id),
  order_index   int not null,
  primary key (assignment_id, activity_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- Looks up the app_user.id for the currently authenticated request.
create or replace function current_app_user_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from app_user where auth_id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table app_user            enable row level security;
alter table class               enable row level security;
alter table membership          enable row level security;
alter table activity            enable row level security;
alter table user_progress       enable row level security;
alter table assignment          enable row level security;
alter table assignment_activity enable row level security;

-- app_user: each user can read & update only their own row. Insert handled by trigger below.
drop policy if exists app_user_self_read   on app_user;
drop policy if exists app_user_self_update on app_user;
create policy app_user_self_read   on app_user for select using (auth_id = auth.uid());
create policy app_user_self_update on app_user for update using (auth_id = auth.uid());

-- class: visible to owner OR any member. Anyone authenticated can create one (becomes teacher).
drop policy if exists class_visible    on class;
drop policy if exists class_owner_edit on class;
drop policy if exists class_insert     on class;
create policy class_visible on class for select using (
  owner_id = current_app_user_id()
  or exists (
    select 1 from membership m
    where m.class_id = class.id and m.user_id = current_app_user_id()
  )
);
create policy class_owner_edit on class for update using (owner_id = current_app_user_id());
create policy class_insert     on class for insert with check (owner_id = current_app_user_id());

-- membership: visible to anyone in the same class. Insert allowed for self-join (student) or
-- by teachers on classes they own.
drop policy if exists membership_select on membership;
drop policy if exists membership_insert on membership;
drop policy if exists membership_delete on membership;
create policy membership_select on membership for select using (
  user_id = current_app_user_id()
  or exists (
    select 1 from membership self
    where self.class_id = membership.class_id and self.user_id = current_app_user_id()
  )
);
create policy membership_insert on membership for insert with check (
  -- self-joining as student
  (user_id = current_app_user_id() and role = 'student')
  -- OR class owner inviting/promoting
  or exists (select 1 from class c where c.id = class_id and c.owner_id = current_app_user_id())
);
create policy membership_delete on membership for delete using (
  user_id = current_app_user_id()
  or exists (select 1 from class c where c.id = class_id and c.owner_id = current_app_user_id())
);

-- activity: catalog is world-readable
drop policy if exists activity_read on activity;
create policy activity_read on activity for select using (true);

-- user_progress: own rows fully accessible; teachers can READ rows of their students.
drop policy if exists user_progress_self    on user_progress;
drop policy if exists user_progress_teacher on user_progress;
create policy user_progress_self on user_progress
  for all using (user_id = current_app_user_id())
  with check (user_id = current_app_user_id());

create policy user_progress_teacher on user_progress for select using (
  exists (
    select 1
    from membership student_m
    join membership teacher_m
      on teacher_m.class_id = student_m.class_id
     and teacher_m.role = 'teacher'
    where student_m.user_id = user_progress.user_id
      and teacher_m.user_id = current_app_user_id()
  )
);

-- assignment: visible to anyone in the class. Only teachers of the class can create/modify.
drop policy if exists assignment_visible        on assignment;
drop policy if exists assignment_teacher_modify on assignment;
create policy assignment_visible on assignment for select using (
  exists (
    select 1 from membership m
    where m.class_id = assignment.class_id and m.user_id = current_app_user_id()
  )
);
create policy assignment_teacher_modify on assignment for all using (
  exists (
    select 1 from membership m
    where m.class_id = assignment.class_id
      and m.user_id = current_app_user_id()
      and m.role = 'teacher'
  )
) with check (
  exists (
    select 1 from membership m
    where m.class_id = assignment.class_id
      and m.user_id = current_app_user_id()
      and m.role = 'teacher'
  )
);

-- assignment_activity inherits permission from its parent assignment.
drop policy if exists assignment_activity_visible        on assignment_activity;
drop policy if exists assignment_activity_teacher_modify on assignment_activity;
create policy assignment_activity_visible on assignment_activity for select using (
  exists (
    select 1 from assignment a
    join membership m on m.class_id = a.class_id and m.user_id = current_app_user_id()
    where a.id = assignment_activity.assignment_id
  )
);
create policy assignment_activity_teacher_modify on assignment_activity for all using (
  exists (
    select 1 from assignment a
    join membership m on m.class_id = a.class_id and m.user_id = current_app_user_id() and m.role = 'teacher'
    where a.id = assignment_activity.assignment_id
  )
) with check (
  exists (
    select 1 from assignment a
    join membership m on m.class_id = a.class_id and m.user_id = current_app_user_id() and m.role = 'teacher'
    where a.id = assignment_activity.assignment_id
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: create an app_user row whenever a new auth.users row appears.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into app_user (auth_id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.email)
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
