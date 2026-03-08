create extension if not exists pgcrypto;

do $$ begin
  create type public.post_category as enum ('question', 'update', 'alert', 'discussion');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_role as enum ('member', 'moderator', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_target_type as enum ('post', 'comment');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('open', 'actioned', 'dismissed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_type as enum ('reply_post', 'reply_comment', 'trending_post');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  zip_code text not null,
  city text not null,
  state_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_path text,
  home_community_id uuid references public.communities (id) on delete set null,
  karma integer not null default 0,
  role public.user_role not null default 'member',
  is_suspended boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.community_neighbors (
  community_id uuid not null references public.communities (id) on delete cascade,
  nearby_community_id uuid not null references public.communities (id) on delete cascade,
  distance_miles numeric(6, 2) not null,
  primary key (community_id, nearby_community_id),
  check (community_id <> nearby_community_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category public.post_category not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  score integer not null default 0,
  comment_count integer not null default 0,
  hot_score double precision not null default 0,
  search_document tsvector,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  depth integer not null default 0,
  score integer not null default 0,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (comment_id, user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  details text,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  type public.notification_type not null,
  message text not null,
  dedupe_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles (id) on delete cascade,
  report_id uuid references public.reports (id) on delete set null,
  action text not null,
  note text,
  target_type public.report_target_type,
  target_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists communities_city_idx on public.communities (city, state_code);
create index if not exists communities_zip_code_idx on public.communities (zip_code);
create index if not exists posts_community_created_idx on public.posts (community_id, created_at desc);
create index if not exists posts_community_hot_idx on public.posts (community_id, hot_score desc);
create index if not exists posts_search_idx on public.posts using gin (search_document);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
create index if not exists comments_parent_idx on public.comments (parent_comment_id);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists profiles_home_community_idx on public.profiles (home_community_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_staff(user_uuid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_uuid
      and role in ('moderator', 'admin')
      and is_suspended = false
  );
$$;

create or replace function public.is_active_member(user_uuid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_uuid
      and is_suspended = false
  );
$$;

create or replace function public.set_post_search_document()
returns trigger
language plpgsql
as $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'a') ||
    setweight(to_tsvector('english', coalesce(new.body, '')), 'b');
  return new;
end;
$$;

create or replace function public.set_comment_depth()
returns trigger
language plpgsql
as $$
declare
  parent_depth integer;
  parent_post uuid;
begin
  if new.parent_comment_id is null then
    new.depth := 0;
    return new;
  end if;

  select depth, post_id
    into parent_depth, parent_post
  from public.comments
  where id = new.parent_comment_id;

  if parent_depth is null then
    raise exception 'Parent comment not found';
  end if;

  if parent_post <> new.post_id then
    raise exception 'Parent comment must belong to the same post';
  end if;

  new.depth := parent_depth + 1;
  return new;
end;
$$;

create or replace function public.calculate_hot_score(score integer, comment_count integer, created_at timestamptz)
returns double precision
language plpgsql
immutable
as $$
declare
  order_value double precision;
  sign_value integer;
  seconds double precision;
begin
  order_value := log(greatest(abs(score) + (comment_count * 0.6), 1));
  sign_value := case when score > 0 then 1 when score < 0 then -1 else 0 end;
  seconds := extract(epoch from created_at) - 1700000000;

  return round((sign_value * order_value + (seconds / 45000))::numeric, 7);
end;
$$;

create or replace function public.recalculate_post_totals(target_post_id uuid)
returns void
language plpgsql
as $$
declare
  total_score integer;
  total_comments integer;
  post_created_at timestamptz;
begin
  select coalesce(sum(value), 0)
    into total_score
  from public.post_votes
  where post_id = target_post_id;

  select count(*)
    into total_comments
  from public.comments
  where post_id = target_post_id
    and deleted_at is null;

  select created_at
    into post_created_at
  from public.posts
  where id = target_post_id;

  update public.posts
  set score = coalesce(total_score, 0),
      comment_count = coalesce(total_comments, 0),
      hot_score = public.calculate_hot_score(
        coalesce(total_score, 0),
        coalesce(total_comments, 0),
        coalesce(post_created_at, timezone('utc', now()))
      )
  where id = target_post_id
    and (
      score is distinct from coalesce(total_score, 0)
      or comment_count is distinct from coalesce(total_comments, 0)
      or hot_score is distinct from public.calculate_hot_score(
        coalesce(total_score, 0),
        coalesce(total_comments, 0),
        coalesce(post_created_at, timezone('utc', now()))
      )
    );
end;
$$;

create or replace function public.recalculate_comment_totals(target_comment_id uuid)
returns void
language plpgsql
as $$
declare
  total_score integer;
begin
  select coalesce(sum(value), 0)
    into total_score
  from public.comment_votes
  where comment_id = target_comment_id;

  update public.comments
  set score = coalesce(total_score, 0)
  where id = target_comment_id
    and score is distinct from coalesce(total_score, 0);
end;
$$;

create or replace function public.recalculate_user_karma(target_user_id uuid)
returns void
language plpgsql
as $$
declare
  post_karma integer;
  comment_karma integer;
begin
  select coalesce(sum(score), 0)
    into post_karma
  from public.posts
  where author_id = target_user_id
    and deleted_at is null;

  select coalesce(sum(score), 0)
    into comment_karma
  from public.comments
  where author_id = target_user_id
    and deleted_at is null;

  update public.profiles
  set karma = coalesce(post_karma, 0) + coalesce(comment_karma, 0)
  where id = target_user_id;
end;
$$;

create or replace function public.handle_post_vote_change()
returns trigger
language plpgsql
as $$
declare
  target_post uuid;
  target_author uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);

  perform public.recalculate_post_totals(target_post);

  select author_id
    into target_author
  from public.posts
  where id = target_post;

  if target_author is not null then
    perform public.recalculate_user_karma(target_author);
  end if;

  return null;
end;
$$;

create or replace function public.handle_comment_vote_change()
returns trigger
language plpgsql
as $$
declare
  target_comment uuid;
  target_author uuid;
begin
  target_comment := coalesce(new.comment_id, old.comment_id);

  perform public.recalculate_comment_totals(target_comment);

  select author_id
    into target_author
  from public.comments
  where id = target_comment;

  if target_author is not null then
    perform public.recalculate_user_karma(target_author);
  end if;

  return null;
end;
$$;

create or replace function public.handle_comment_change()
returns trigger
language plpgsql
as $$
declare
  target_post uuid;
  comment_author uuid;
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  target_post := coalesce(new.post_id, old.post_id);
  comment_author := coalesce(new.author_id, old.author_id);

  perform public.recalculate_post_totals(target_post);

  if comment_author is not null then
    perform public.recalculate_user_karma(comment_author);
  end if;

  return null;
end;
$$;

create or replace function public.handle_post_change()
returns trigger
language plpgsql
as $$
begin
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  perform public.recalculate_post_totals(coalesce(new.id, old.id));
  perform public.recalculate_user_karma(coalesce(new.author_id, old.author_id));
  return null;
end;
$$;

create or replace function public.notify_on_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_author uuid;
  post_author uuid;
  post_community_id uuid;
  actor_name text;
begin
  select username
    into actor_name
  from public.profiles
  where id = new.author_id;

  if new.parent_comment_id is not null then
    select author_id
      into parent_author
    from public.comments
    where id = new.parent_comment_id;

    if parent_author is not null and parent_author <> new.author_id then
      insert into public.notifications (
        user_id,
        actor_id,
        post_id,
        comment_id,
        community_id,
        type,
        message
      )
      select
        parent_author,
        new.author_id,
        new.post_id,
        new.id,
        p.community_id,
        'reply_comment',
        coalesce(actor_name, 'A neighbor') || ' replied to your comment.'
      from public.posts p
      where p.id = new.post_id;
    end if;
  else
    select p.author_id, p.community_id
      into post_author, post_community_id
    from public.posts p
    where p.id = new.post_id;

    if post_author is not null and post_author <> new.author_id then
      insert into public.notifications (
        user_id,
        actor_id,
        post_id,
        comment_id,
        community_id,
        type,
        message
      )
      values (
        post_author,
        new.author_id,
        new.post_id,
        new.id,
        post_community_id,
        'reply_post',
        coalesce(actor_name, 'A neighbor') || ' replied to your post.'
      );
    end if;
  end if;

  return null;
end;
$$;

create or replace function public.toggle_post_vote(target_post_id uuid, incoming_vote smallint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_vote smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if incoming_vote not in (-1, 1) then
    raise exception 'Vote value must be -1 or 1';
  end if;

  select value
    into existing_vote
  from public.post_votes
  where post_id = target_post_id
    and user_id = auth.uid();

  if existing_vote is null then
    insert into public.post_votes (post_id, user_id, value)
    values (target_post_id, auth.uid(), incoming_vote);
    return incoming_vote;
  end if;

  if existing_vote = incoming_vote then
    delete from public.post_votes
    where post_id = target_post_id
      and user_id = auth.uid();
    return 0;
  end if;

  update public.post_votes
  set value = incoming_vote
  where post_id = target_post_id
    and user_id = auth.uid();

  return incoming_vote;
end;
$$;

create or replace function public.toggle_comment_vote(target_comment_id uuid, incoming_vote smallint)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_vote smallint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if incoming_vote not in (-1, 1) then
    raise exception 'Vote value must be -1 or 1';
  end if;

  select value
    into existing_vote
  from public.comment_votes
  where comment_id = target_comment_id
    and user_id = auth.uid();

  if existing_vote is null then
    insert into public.comment_votes (comment_id, user_id, value)
    values (target_comment_id, auth.uid(), incoming_vote);
    return incoming_vote;
  end if;

  if existing_vote = incoming_vote then
    delete from public.comment_votes
    where comment_id = target_comment_id
      and user_id = auth.uid();
    return 0;
  end if;

  update public.comment_votes
  set value = incoming_vote
  where comment_id = target_comment_id
    and user_id = auth.uid();

  return incoming_vote;
end;
$$;

drop trigger if exists profiles_handle_updated_at on public.profiles;
create trigger profiles_handle_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists posts_handle_updated_at on public.posts;
create trigger posts_handle_updated_at
before update on public.posts
for each row
execute function public.handle_updated_at();

drop trigger if exists comments_handle_updated_at on public.comments;
create trigger comments_handle_updated_at
before update on public.comments
for each row
execute function public.handle_updated_at();

drop trigger if exists reports_handle_updated_at on public.reports;
create trigger reports_handle_updated_at
before update on public.reports
for each row
execute function public.handle_updated_at();

drop trigger if exists post_votes_handle_updated_at on public.post_votes;
create trigger post_votes_handle_updated_at
before update on public.post_votes
for each row
execute function public.handle_updated_at();

drop trigger if exists comment_votes_handle_updated_at on public.comment_votes;
create trigger comment_votes_handle_updated_at
before update on public.comment_votes
for each row
execute function public.handle_updated_at();

drop trigger if exists posts_set_search_document on public.posts;
create trigger posts_set_search_document
before insert or update of title, body on public.posts
for each row
execute function public.set_post_search_document();

drop trigger if exists comments_set_depth on public.comments;
create trigger comments_set_depth
before insert or update of parent_comment_id, post_id on public.comments
for each row
execute function public.set_comment_depth();

drop trigger if exists posts_handle_change on public.posts;
create trigger posts_handle_change
after insert or update or delete on public.posts
for each row
execute function public.handle_post_change();

drop trigger if exists comments_handle_change on public.comments;
create trigger comments_handle_change
after insert or update or delete on public.comments
for each row
execute function public.handle_comment_change();

drop trigger if exists comments_notify_insert on public.comments;
create trigger comments_notify_insert
after insert on public.comments
for each row
execute function public.notify_on_comment_insert();

drop trigger if exists post_votes_handle_change on public.post_votes;
create trigger post_votes_handle_change
after insert or update or delete on public.post_votes
for each row
execute function public.handle_post_vote_change();

drop trigger if exists comment_votes_handle_change on public.comment_votes;
create trigger comment_votes_handle_change
after insert or update or delete on public.comment_votes
for each row
execute function public.handle_comment_vote_change();

alter table public.communities enable row level security;
alter table public.profiles enable row level security;
alter table public.community_neighbors enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.moderation_actions enable row level security;

drop policy if exists "communities are publicly readable" on public.communities;
create policy "communities are publicly readable"
on public.communities
for select
using (true);

drop policy if exists "community neighbors are publicly readable" on public.community_neighbors;
create policy "community neighbors are publicly readable"
on public.community_neighbors
for select
using (true);

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
on public.profiles
for select
using (true);

drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "staff can update profiles" on public.profiles;
create policy "staff can update profiles"
on public.profiles
for update
to authenticated
using (public.is_staff())
with check (true);

drop policy if exists "posts are publicly readable" on public.posts;
create policy "posts are publicly readable"
on public.posts
for select
using (true);

drop policy if exists "active members can create posts" on public.posts;
create policy "active members can create posts"
on public.posts
for insert
to authenticated
with check (author_id = auth.uid() and public.is_active_member());

drop policy if exists "authors can update own posts" on public.posts;
create policy "authors can update own posts"
on public.posts
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "staff can moderate posts" on public.posts;
create policy "staff can moderate posts"
on public.posts
for update
to authenticated
using (public.is_staff())
with check (true);

drop policy if exists "comments are publicly readable" on public.comments;
create policy "comments are publicly readable"
on public.comments
for select
using (true);

drop policy if exists "active members can create comments" on public.comments;
create policy "active members can create comments"
on public.comments
for insert
to authenticated
with check (author_id = auth.uid() and public.is_active_member());

drop policy if exists "authors can update own comments" on public.comments;
create policy "authors can update own comments"
on public.comments
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "staff can moderate comments" on public.comments;
create policy "staff can moderate comments"
on public.comments
for update
to authenticated
using (public.is_staff())
with check (true);

drop policy if exists "users can read own post votes" on public.post_votes;
create policy "users can read own post votes"
on public.post_votes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can manage own post votes" on public.post_votes;
create policy "users can manage own post votes"
on public.post_votes
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can read own comment votes" on public.comment_votes;
create policy "users can read own comment votes"
on public.comment_votes
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can manage own comment votes" on public.comment_votes;
create policy "users can manage own comment votes"
on public.comment_votes
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reporters and staff can read reports" on public.reports;
create policy "reporters and staff can read reports"
on public.reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_staff());

drop policy if exists "active members can create reports" on public.reports;
create policy "active members can create reports"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid() and public.is_active_member());

drop policy if exists "staff can update reports" on public.reports;
create policy "staff can update reports"
on public.reports
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "staff can read moderation actions" on public.moderation_actions;
create policy "staff can read moderation actions"
on public.moderation_actions
for select
to authenticated
using (public.is_staff());

drop policy if exists "staff can insert moderation actions" on public.moderation_actions;
create policy "staff can insert moderation actions"
on public.moderation_actions
for insert
to authenticated
with check (moderator_id = auth.uid() and public.is_staff());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar files are publicly readable" on storage.objects;
create policy "avatar files are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "users can upload own avatar files" on storage.objects;
create policy "users can upload own avatar files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users can update own avatar files" on storage.objects;
create policy "users can update own avatar files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users can delete own avatar files" on storage.objects;
create policy "users can delete own avatar files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
