create table if not exists public.rate_limit_buckets (
  scope text not null,
  identifier text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, identifier, window_start),
  check (count >= 0)
);

create table if not exists public.content_fingerprints (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  fingerprint text not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  identifier text,
  created_at timestamptz not null default timezone('utc', now()),
  check (actor_id is not null or identifier is not null)
);

create index if not exists rate_limit_buckets_scope_window_idx
on public.rate_limit_buckets (scope, window_start desc);

create index if not exists content_fingerprints_scope_actor_idx
on public.content_fingerprints (scope, actor_id, created_at desc);

create index if not exists content_fingerprints_scope_identifier_idx
on public.content_fingerprints (scope, identifier, created_at desc);

create index if not exists content_fingerprints_scope_fingerprint_idx
on public.content_fingerprints (scope, fingerprint, created_at desc);

create or replace function public.consume_rate_limit(
  limit_scope text,
  subject_identifier text,
  max_requests integer,
  window_seconds integer,
  request_time timestamptz default timezone('utc', now())
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer,
  current_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz;
  bucket_end timestamptz;
  next_count integer;
begin
  if coalesce(limit_scope, '') = '' then
    raise exception 'Rate limit scope is required';
  end if;

  if coalesce(subject_identifier, '') = '' then
    raise exception 'Rate limit identifier is required';
  end if;

  if max_requests < 1 then
    raise exception 'Rate limit max_requests must be positive';
  end if;

  if window_seconds < 1 then
    raise exception 'Rate limit window_seconds must be positive';
  end if;

  bucket_start :=
    to_timestamp(
      floor(extract(epoch from request_time) / window_seconds) * window_seconds
    );
  bucket_end := bucket_start + make_interval(secs => window_seconds);

  insert into public.rate_limit_buckets (
    scope,
    identifier,
    window_start,
    count
  )
  values (
    limit_scope,
    subject_identifier,
    bucket_start,
    1
  )
  on conflict (scope, identifier, window_start)
  do update
    set count = public.rate_limit_buckets.count + 1,
        updated_at = timezone('utc', now())
  returning count
  into next_count;

  allowed := next_count <= max_requests;
  remaining := greatest(max_requests - least(next_count, max_requests), 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from bucket_end - request_time))::integer)
  end;
  current_count := next_count;
  reset_at := bucket_end;

  return next;
end;
$$;

create or replace function public.record_content_fingerprint(
  content_scope text,
  content_fingerprint text,
  actor_uuid uuid default null,
  subject_identifier text default null,
  duplicate_window_seconds integer default 900,
  request_time timestamptz default timezone('utc', now())
)
returns table (
  is_duplicate boolean,
  duplicate_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  if coalesce(content_scope, '') = '' then
    raise exception 'Content scope is required';
  end if;

  if coalesce(content_fingerprint, '') = '' then
    raise exception 'Content fingerprint is required';
  end if;

  if duplicate_window_seconds < 1 then
    raise exception 'Duplicate window must be positive';
  end if;

  if actor_uuid is null and coalesce(subject_identifier, '') = '' then
    raise exception 'Fingerprint actor or identifier is required';
  end if;

  select count(*)
    into recent_count
  from public.content_fingerprints
  where scope = content_scope
    and fingerprint = content_fingerprint
    and created_at >= request_time - make_interval(secs => duplicate_window_seconds)
    and (
      (actor_uuid is not null and actor_id = actor_uuid)
      or (subject_identifier is not null and identifier = subject_identifier)
    );

  insert into public.content_fingerprints (
    scope,
    fingerprint,
    actor_id,
    identifier
  )
  values (
    content_scope,
    content_fingerprint,
    actor_uuid,
    subject_identifier
  );

  is_duplicate := recent_count > 0;
  duplicate_count := recent_count + 1;

  return next;
end;
$$;

drop trigger if exists rate_limit_buckets_handle_updated_at on public.rate_limit_buckets;
create trigger rate_limit_buckets_handle_updated_at
before update on public.rate_limit_buckets
for each row
execute function public.handle_updated_at();

alter table public.rate_limit_buckets enable row level security;
alter table public.content_fingerprints enable row level security;

drop policy if exists "staff can inspect rate limit buckets" on public.rate_limit_buckets;
create policy "staff can inspect rate limit buckets"
on public.rate_limit_buckets
for select
to authenticated
using (public.is_staff());

drop policy if exists "staff can inspect content fingerprints" on public.content_fingerprints;
create policy "staff can inspect content fingerprints"
on public.content_fingerprints
for select
to authenticated
using (public.is_staff());
