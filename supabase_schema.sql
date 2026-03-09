-- ============================================================
-- TarawihTribe Supabase Schema
-- Run this in Supabase SQL Editor before launching
-- ============================================================

-- IMPORTANT: In Supabase Dashboard → Authentication → Settings:
-- 1. Set "Confirm email" to OFF (for easier testing)
-- 2. Add your site URL to "Redirect URLs" (e.g. http://localhost:5173)
-- 3. For Google OAuth: Authentication → Providers → Google → Enable

-- 1. User profiles
create table if not exists public.tarawihtribe_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  role text default 'member',
  created_at timestamptz default now()
);
alter table public.tarawihtribe_profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can view own profile" on public.tarawihtribe_profiles;
drop policy if exists "Users can update own profile" on public.tarawihtribe_profiles;
drop policy if exists "Public read profiles" on public.tarawihtribe_profiles;
drop policy if exists "Users can insert own profile" on public.tarawihtribe_profiles;

create policy "Public read profiles" on public.tarawihtribe_profiles for select using (true);
create policy "Users can insert own profile" on public.tarawihtribe_profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.tarawihtribe_profiles for update using (auth.uid() = id);

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.tarawihtribe_profiles (id, username, display_name)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'user'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Crowd reports
create table if not exists public.tarawihtribe_crowd_reports (
  id uuid default gen_random_uuid() primary key,
  zone_id text not null,
  status text not null check (status in ('empty', 'moderate', 'crowded', 'full')),
  user_id uuid references public.tarawihtribe_profiles on delete set null,
  created_at timestamptz default now()
);
alter table public.tarawihtribe_crowd_reports enable row level security;
drop policy if exists "Anyone can view crowd reports" on public.tarawihtribe_crowd_reports;
drop policy if exists "Authenticated users can insert" on public.tarawihtribe_crowd_reports;
create policy "Anyone can view crowd reports" on public.tarawihtribe_crowd_reports for select using (true);
create policy "Authenticated users can insert" on public.tarawihtribe_crowd_reports for insert with check (auth.uid() is not null);

-- 4. Events
create table if not exists public.tarawihtribe_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date date not null,
  time text,
  location text,
  category text default 'prayer',
  max_capacity int default 100,
  rsvp_count int default 0,
  is_free boolean default true,
  approved boolean default false,
  created_by uuid references public.tarawihtribe_profiles on delete set null,
  created_at timestamptz default now()
);
alter table public.tarawihtribe_events enable row level security;
drop policy if exists "Public can view approved events" on public.tarawihtribe_events;
drop policy if exists "Admins can manage all events" on public.tarawihtribe_events;
create policy "Public can view approved events" on public.tarawihtribe_events for select using (approved = true);
create policy "Admins can manage all events" on public.tarawihtribe_events for all using (
  exists (select 1 from tarawihtribe_profiles where id = auth.uid() and role = 'admin')
);

-- Seed some events
insert into public.tarawihtribe_events (title, description, date, time, location, category, max_capacity, rsvp_count, is_free, approved)
values
  ('Qiamullail — Night 21', 'Special night prayer for Lailatul Qadr. Bring your family!', '2025-03-21', '02:00', 'Main Hall', 'prayer', 200, 47, true, true),
  ('Kuliah Tafsir After Isha', 'Daily Quran tafsir session by Ustaz Ahmad.', '2025-03-15', '21:30', 'Surau', 'lecture', 50, 23, true, true),
  ('Community Iftar Besar', 'Annual community iftar event. Food provided!', '2025-03-18', '18:30', 'Mosque Compound', 'iftar', 300, 156, true, true),
  ('Terawih Champion Badge Night', 'Certificate ceremony for jemaah who attended all 30 nights.', '2025-03-29', '20:45', 'Main Hall', 'special', 150, 89, true, true),
  ('Kids Ramadan Art Competition', 'Creative art competition for children aged 7-12.', '2025-03-16', '10:00', 'Community Hall', 'kids', 80, 35, true, true)
on conflict do nothing;

-- 5. Event RSVPs
create table if not exists public.tarawihtribe_event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.tarawihtribe_events on delete cascade,
  user_id uuid references public.tarawihtribe_profiles on delete cascade,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);
alter table public.tarawihtribe_event_rsvps enable row level security;
drop policy if exists "Users can manage own RSVPs" on public.tarawihtribe_event_rsvps;
drop policy if exists "Public can view RSVP counts" on public.tarawihtribe_event_rsvps;
create policy "Users can manage own RSVPs" on public.tarawihtribe_event_rsvps for all using (auth.uid() = user_id);
create policy "Public can view RSVP counts" on public.tarawihtribe_event_rsvps for select using (true);

-- 6. Bingo progress
create table if not exists public.tarawihtribe_bingo_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.tarawihtribe_profiles on delete cascade,
  day_number int not null check (day_number between 1 and 30),
  completed_at timestamptz default now(),
  unique(user_id, day_number)
);
alter table public.tarawihtribe_bingo_progress enable row level security;
drop policy if exists "Users can manage own bingo" on public.tarawihtribe_bingo_progress;
drop policy if exists "Public can view bingo" on public.tarawihtribe_bingo_progress;
create policy "Users can manage own bingo" on public.tarawihtribe_bingo_progress for all using (auth.uid() = user_id);
create policy "Public can view bingo" on public.tarawihtribe_bingo_progress for select using (true);

-- 7. Activities (friend feed)
create table if not exists public.tarawihtribe_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.tarawihtribe_profiles on delete cascade,
  type text not null,
  data jsonb,
  created_at timestamptz default now()
);
alter table public.tarawihtribe_activities enable row level security;
drop policy if exists "Public can view activities" on public.tarawihtribe_activities;
drop policy if exists "Users can create own activities" on public.tarawihtribe_activities;
create policy "Public can view activities" on public.tarawihtribe_activities for select using (true);
create policy "Users can create own activities" on public.tarawihtribe_activities for insert with check (auth.uid() = user_id);

-- 8. Lost items
create table if not exists public.tarawihtribe_lost_items (
  id uuid default gen_random_uuid() primary key,
  type text not null,
  description text,
  location_found text,
  status text default 'unclaimed' check (status in ('unclaimed', 'claimed')),
  reported_by uuid references public.tarawihtribe_profiles on delete set null,
  approved boolean default false,
  created_at timestamptz default now()
);
alter table public.tarawihtribe_lost_items enable row level security;
drop policy if exists "Public can view approved lost items" on public.tarawihtribe_lost_items;
drop policy if exists "Users can report lost items" on public.tarawihtribe_lost_items;
create policy "Public can view approved lost items" on public.tarawihtribe_lost_items for select using (approved = true);
create policy "Users can report lost items" on public.tarawihtribe_lost_items for insert with check (auth.uid() is not null);

-- 9. Weekly leaderboard view
create or replace view public.tarawihtribe_leaderboard as
  select 
    p.id,
    p.display_name,
    p.username,
    count(b.day_number) as days_completed
  from tarawihtribe_profiles p
  left join tarawihtribe_bingo_progress b on b.user_id = p.id
  group by p.id, p.display_name, p.username
  order by days_completed desc
  limit 50;

-- ============================================================
-- DONE! Your database is ready.
-- 
-- NEXT STEPS:
-- 1. Go to Authentication → Settings → Disable "Confirm email" for testing
-- 2. Add http://localhost:5173 to "Redirect URLs"
-- 3. Update .env.local with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
-- 4. To make yourself admin: 
--    UPDATE tarawihtribe_profiles SET role = 'admin' WHERE id = 'your-user-id';
-- ============================================================
