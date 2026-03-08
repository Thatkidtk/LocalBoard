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
