insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000201',
    'authenticated',
    'authenticated',
    'riverwatch@localboard.dev',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"username":"riverwatch","home_community_slug":"central-austin-tx-73301"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000202',
    'authenticated',
    'authenticated',
    'moderator@localboard.dev',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"username":"blockcaptain","home_community_slug":"chelsea-ny-10001"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000203',
    'authenticated',
    'authenticated',
    'kate@localboard.dev',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"username":"cornerstorekate","home_community_slug":"mission-district-ca-94110"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000204',
    'authenticated',
    'authenticated',
    'admin@localboard.dev',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}',
    '{"username":"citydesk","home_community_slug":"chelsea-ny-10001"}',
    timezone('utc', now()),
    timezone('utc', now()),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at,
  last_sign_in_at
)
values
  (
    'riverwatch@localboard.dev',
    '00000000-0000-0000-0000-000000000201',
    '{"sub":"00000000-0000-0000-0000-000000000201","email":"riverwatch@localboard.dev"}',
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    'moderator@localboard.dev',
    '00000000-0000-0000-0000-000000000202',
    '{"sub":"00000000-0000-0000-0000-000000000202","email":"moderator@localboard.dev"}',
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    'kate@localboard.dev',
    '00000000-0000-0000-0000-000000000203',
    '{"sub":"00000000-0000-0000-0000-000000000203","email":"kate@localboard.dev"}',
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  ),
  (
    'admin@localboard.dev',
    '00000000-0000-0000-0000-000000000204',
    '{"sub":"00000000-0000-0000-0000-000000000204","email":"admin@localboard.dev"}',
    'email',
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
on conflict do nothing;

insert into public.communities (
  id,
  slug,
  name,
  zip_code,
  city,
  state_code,
  latitude,
  longitude,
  description
)
values
  ('00000000-0000-0000-0000-000000000101', 'chelsea-ny-10001', 'Chelsea LocalBoard', '10001', 'Chelsea', 'NY', 40.7506, -73.9971, 'Community updates, local questions, and neighborhood alerts for Chelsea.'),
  ('00000000-0000-0000-0000-000000000102', 'east-village-ny-10003', 'East Village LocalBoard', '10003', 'East Village', 'NY', 40.7314, -73.9897, 'Live neighborhood updates from East Village residents.'),
  ('00000000-0000-0000-0000-000000000103', 'park-slope-ny-11215', 'Park Slope LocalBoard', '11215', 'Park Slope', 'NY', 40.6681, -73.9806, 'Block-by-block updates from Park Slope.'),
  ('00000000-0000-0000-0000-000000000104', 'cambridgeport-ma-02139', 'Cambridgeport LocalBoard', '02139', 'Cambridgeport', 'MA', 42.3647, -71.1043, 'Local forum for Cambridgeport residents.'),
  ('00000000-0000-0000-0000-000000000105', 'rittenhouse-pa-19103', 'Rittenhouse LocalBoard', '19103', 'Rittenhouse', 'PA', 39.9522, -75.1741, 'Neighborhood posts for Rittenhouse neighbors.'),
  ('00000000-0000-0000-0000-000000000106', 'lincoln-park-il-60614', 'Lincoln Park LocalBoard', '60614', 'Lincoln Park', 'IL', 41.9227, -87.6533, 'Street-level conversations across Lincoln Park.'),
  ('00000000-0000-0000-0000-000000000107', 'central-austin-tx-73301', 'Central Austin LocalBoard', '73301', 'Central Austin', 'TX', 30.2666, -97.7333, 'LocalBoard for Central Austin questions and alerts.'),
  ('00000000-0000-0000-0000-000000000108', 'mission-district-ca-94110', 'Mission District LocalBoard', '94110', 'Mission District', 'CA', 37.7487, -122.4158, 'Live neighborhood updates for the Mission District.'),
  ('00000000-0000-0000-0000-000000000109', 'downtown-seattle-wa-98101', 'Downtown Seattle LocalBoard', '98101', 'Downtown Seattle', 'WA', 47.6105, -122.3348, 'Downtown Seattle local forum for questions, updates, and alerts.'),
  ('00000000-0000-0000-0000-000000000110', 'midtown-atlanta-ga-30309', 'Midtown Atlanta LocalBoard', '30309', 'Midtown Atlanta', 'GA', 33.7823, -84.3885, 'Updates and discussions from Midtown Atlanta.')
on conflict (id) do nothing;

insert into public.community_neighbors (community_id, nearby_community_id, distance_miles)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000102', 2.10),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000103', 5.40),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000101', 2.10),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000103', 4.70),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000102', 4.70),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000101', 5.40),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000110', 812.60),
  ('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000107', 812.60),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000109', 679.40),
  ('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000108', 679.40)
on conflict do nothing;

insert into public.profiles (
  id,
  username,
  home_community_id,
  role,
  karma,
  is_suspended
)
values
  ('00000000-0000-0000-0000-000000000201', 'riverwatch', '00000000-0000-0000-0000-000000000107', 'member', 0, false),
  ('00000000-0000-0000-0000-000000000202', 'blockcaptain', '00000000-0000-0000-0000-000000000101', 'moderator', 0, false),
  ('00000000-0000-0000-0000-000000000203', 'cornerstorekate', '00000000-0000-0000-0000-000000000108', 'member', 0, false),
  ('00000000-0000-0000-0000-000000000204', 'citydesk', '00000000-0000-0000-0000-000000000101', 'admin', 0, false)
on conflict (id) do update
set username = excluded.username,
    home_community_id = excluded.home_community_id,
    role = excluded.role;

insert into public.posts (
  id,
  title,
  body,
  category,
  author_id,
  community_id,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000301', 'Why did the Walmart on 6th close overnight?', 'Drove by this morning and the doors were chained. Did the city pull permits, or is this temporary renovation work?', 'question', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000107', timezone('utc', now()) - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000302', 'Power outage near 14th Street and 8th Ave', 'ConEd crews are on-site now. Traffic lights are out for two blocks, so expect a slow crawl through the intersection.', 'alert', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', timezone('utc', now()) - interval '1 hour'),
  ('00000000-0000-0000-0000-000000000303', 'Mission playground reopening moved to Saturday', 'Rec department pushed the ribbon cutting one day because crews are still replacing the soft flooring around the new slides.', 'update', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000108', timezone('utc', now()) - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000304', 'Anyone know why garbage pickup skipped 7th Ave?', 'Our whole block still has bags on the curb. Trying to figure out if there was a schedule change or labor issue.', 'discussion', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000103', timezone('utc', now()) - interval '11 hours'),
  ('00000000-0000-0000-0000-000000000305', 'Blue Line platform flooding at Jackson', 'Water is coming through the west stairwell again. CTA staff are redirecting people to the other entrance.', 'alert', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000106', timezone('utc', now()) - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000306', 'Small business grants info session at the library tonight', 'The neighborhood business alliance is hosting a Q&A at 6:30 PM for anyone applying to the city storefront grant round.', 'update', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000105', timezone('utc', now()) - interval '16 hours'),
  ('00000000-0000-0000-0000-000000000307', 'Street racing noise getting worse on weekends', 'We have had two near-collisions this month on Peachtree. Curious whether anyone has had success getting traffic enforcement to respond.', 'discussion', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000110', timezone('utc', now()) - interval '8 hours'),
  ('00000000-0000-0000-0000-000000000308', 'Community board agenda posted for next Tuesday', 'Housing permits, school crossing redesign, and the late-night liquor variance are all on the agenda this week.', 'update', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', timezone('utc', now()) - interval '22 hours')
on conflict (id) do nothing;

insert into public.comments (
  id,
  body,
  author_id,
  post_id,
  parent_comment_id,
  created_at
)
values
  ('00000000-0000-0000-0000-000000000401', 'City permit records show an emergency plumbing issue filed yesterday. That usually means a short closure, not a permanent one.', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000301', null, timezone('utc', now()) - interval '90 minutes'),
  ('00000000-0000-0000-0000-000000000402', 'That lines up with what an employee told me. They said they hope to reopen after inspections.', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000401', timezone('utc', now()) - interval '66 minutes'),
  ('00000000-0000-0000-0000-000000000403', 'Saw a transformer blow at about 5:10 AM. If you are driving through there, four-way stop rules are in effect.', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302', null, timezone('utc', now()) - interval '42 minutes'),
  ('00000000-0000-0000-0000-000000000404', 'The flooding is from runoff around the construction fencing. It happened twice last month too.', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000305', null, timezone('utc', now()) - interval '156 minutes'),
  ('00000000-0000-0000-0000-000000000405', 'Please keep filing 311 reports. The volume is what got the city to install speed cushions on our block.', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000307', null, timezone('utc', now()) - interval '312 minutes')
on conflict (id) do nothing;

insert into public.post_votes (post_id, user_id, value)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202', 1),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000203', 1),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', 1),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000204', 1),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000204', 1),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000202', 1)
on conflict do nothing;

insert into public.comment_votes (comment_id, user_id, value)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000201', 1),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000203', 1),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000202', 1),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000202', 1)
on conflict do nothing;

insert into public.reports (
  id,
  target_type,
  target_id,
  reason,
  details,
  reporter_id,
  status,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000501',
    'post',
    '00000000-0000-0000-0000-000000000307',
    'Missing source',
    'The claim about near-collisions needs context before it spirals.',
    '00000000-0000-0000-0000-000000000203',
    'open',
    timezone('utc', now()) - interval '4 hours'
  )
on conflict (id) do nothing;

insert into public.notifications (
  id,
  user_id,
  actor_id,
  post_id,
  comment_id,
  community_id,
  type,
  message,
  read_at,
  dedupe_key,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000601',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000401',
    '00000000-0000-0000-0000-000000000107',
    'reply_post',
    'blockcaptain replied to your post about the Walmart closure.',
    null,
    'seed:reply-post-1',
    timezone('utc', now()) - interval '78 minutes'
  ),
  (
    '00000000-0000-0000-0000-000000000602',
    '00000000-0000-0000-0000-000000000202',
    null,
    '00000000-0000-0000-0000-000000000302',
    null,
    '00000000-0000-0000-0000-000000000101',
    'trending_post',
    'Power outage near 14th Street is trending in your area.',
    null,
    'seed:trending-post-1',
    timezone('utc', now()) - interval '30 minutes'
  )
on conflict (id) do nothing;

insert into public.moderation_actions (
  id,
  moderator_id,
  report_id,
  action,
  note,
  target_type,
  target_id,
  created_at
)
values
  (
    '00000000-0000-0000-0000-000000000701',
    '00000000-0000-0000-0000-000000000204',
    null,
    'seed_data',
    'Initial dataset created for LocalBoard.',
    null,
    null,
    timezone('utc', now()) - interval '20 minutes'
  )
on conflict (id) do nothing;

select public.recalculate_post_totals(id) from public.posts where id in (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000302',
  '00000000-0000-0000-0000-000000000303',
  '00000000-0000-0000-0000-000000000304',
  '00000000-0000-0000-0000-000000000305',
  '00000000-0000-0000-0000-000000000306',
  '00000000-0000-0000-0000-000000000307',
  '00000000-0000-0000-0000-000000000308'
);

select public.recalculate_comment_totals(id) from public.comments where id in (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000402',
  '00000000-0000-0000-0000-000000000403',
  '00000000-0000-0000-0000-000000000404',
  '00000000-0000-0000-0000-000000000405'
);

select public.recalculate_user_karma(id) from public.profiles where id in (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000204'
);
