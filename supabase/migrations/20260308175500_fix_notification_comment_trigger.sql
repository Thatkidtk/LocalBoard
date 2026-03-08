create or replace function public.notify_on_comment_insert()
returns trigger
language plpgsql
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
