-- ============================================================
-- TarawihTribe Supabase Schema
-- Run this in Supabase SQL Editor before launching
-- ============================================================

-- 1. User profiles
create table if not exists public.tarawihtribe_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  role text default 'member',
  created_at timestamptz default now()
);
alter table public.tarawihtribe_profiles enable row level security;
create policy "Users can view own profile" on public.tarawihtribe_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.tarawihtribe_profiles for update using (auth.uid() = id);
create policy "Public read profiles" on public.tarawihtribe_profiles for select using (true);

-- 2. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.tarawihtribe_profiles (id, username, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
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
create policy "Public can view approved events" on public.tarawihtribe_events for select using (approved = true);
create policy "Admins can manage all events" on public.tarawihtribe_events for all using (
  exists (select 1 from tarawihtribe_profiles where id = auth.uid() and role = 'admin')
);

-- 5. Event RSVPs
create table if not exists public.tarawihtribe_event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.tarawihtribe_events on delete cascade,
  user_id uuid references public.tarawihtribe_profiles on delete cascade,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);
alter table public.tarawihtribe_event_rsvps enable row level security;
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
-- ============================================================
