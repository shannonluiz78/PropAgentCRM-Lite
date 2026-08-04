-- Run this once in Supabase SQL Editor.
-- 1. New activities table: a log of what actually happened (calls, notes,
--    viewings) tied optionally to a customer, property, and/or listing.
-- 2. Commission fields on listings: fill either a rate (%) or a fixed
--    amount — whichever the agent knows. Used to compute a commission
--    pipeline on the dashboard.

create table if not exists activities (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  activity_type text not null check (
    activity_type in ('call','email','meeting','note','viewing','other')
  ),
  content text not null,
  customer_id uuid references customers(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  listing_id uuid references listings(id) on delete set null,
  owner_id uuid references auth.users(id) default auth.uid()
);

alter table activities enable row level security;

drop policy if exists "owner_full_access" on activities;
create policy "owner_full_access" on activities
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

alter table listings
  add column if not exists commission_rate numeric;

alter table listings
  add column if not exists commission_amount numeric;
