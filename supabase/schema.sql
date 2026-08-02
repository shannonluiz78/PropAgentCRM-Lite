-- ============================================================================
-- PropAgent CRM Lite — v0.1 schema
-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Core CRM tables
-- ---------------------------------------------------------------------------

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null,
  phone text,
  email text,
  type text not null check (type in ('buyer','seller','landlord','tenant')),
  status text not null default 'new' check (
    status in ('new','contacted','qualified','viewing','offer','closed','lost')
  ),
  source text,                     -- e.g. "Instagram", "Referral", "PropertyGuru"
  requirements text,               -- free text: budget, area, unit type, timeline
  area_focus text,                 -- e.g. "Yishun, Sembawang, Woodlands"
  last_contacted_at timestamptz,
  owner_id uuid references auth.users(id) default auth.uid()
);

create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  address text not null,
  property_type text,              -- HDB, condo, landed, etc.
  bedrooms int,
  bathrooms int,
  size_sqft int,
  owner_customer_id uuid references customers(id) on delete set null,
  notes text,
  owner_id uuid references auth.users(id) default auth.uid()
);

create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  property_id uuid references properties(id) on delete cascade,
  listing_type text not null check (listing_type in ('sale','rental')),
  price numeric,
  status text not null default 'draft' check (
    status in ('draft','active','under_offer','closed','withdrawn')
  ),
  description text,                -- AI-generated or manual marketing copy
  owner_id uuid references auth.users(id) default auth.uid()
);

create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  title text not null,
  event_type text not null default 'viewing' check (
    event_type in ('viewing','meeting','follow_up','other')
  ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  customer_id uuid references customers(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  owner_id uuid references auth.users(id) default auth.uid()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  title text not null,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','done')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  source text not null default 'manual' check (source in ('manual','agent')),
  customer_id uuid references customers(id) on delete set null,
  owner_id uuid references auth.users(id) default auth.uid()
);

-- ---------------------------------------------------------------------------
-- Agent layer: SOPs, memory, and the human approval queue
-- ---------------------------------------------------------------------------

-- Standing instructions the Lead Agent reads to decide what to delegate,
-- e.g. "if a buyer lead has no contact logged in 4 hours, draft a follow-up".
create table if not exists sop_rules (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  name text not null,
  trigger_description text not null,   -- plain-English trigger condition
  action_description text not null,    -- plain-English action to take
  target_agent text not null check (
    target_agent in ('customer_agent','listing_agent','scheduling_agent','task_agent')
  ),
  is_active boolean not null default true,
  owner_id uuid references auth.users(id) default auth.uid()
);

-- Per-customer memory agents read/write so they don't start cold each run.
create table if not exists agent_memory (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  customer_id uuid references customers(id) on delete cascade,
  agent_name text not null,
  note text not null,
  owner_id uuid references auth.users(id) default auth.uid()
);

-- Everything agents draft that touches a customer (message, listing publish,
-- calendar invite) lands here as 'pending' until you approve, edit, or reject it.
-- Nothing in this table is ever sent/published automatically.
create table if not exists agent_actions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  agent_name text not null,
  action_type text not null,        -- e.g. "whatsapp_reply", "listing_description", "viewing_reminder"
  customer_id uuid references customers(id) on delete cascade,
  draft_content text not null,
  status text not null default 'pending' check (
    status in ('pending','approved','edited','rejected','sent')
  ),
  reviewed_at timestamptz,
  owner_id uuid references auth.users(id) default auth.uid()
);

-- ---------------------------------------------------------------------------
-- Row Level Security — each agent (you) only sees their own records.
-- Single-user MVP today; this is what makes adding teammates later safe.
-- ---------------------------------------------------------------------------

alter table customers enable row level security;
alter table properties enable row level security;
alter table listings enable row level security;
alter table calendar_events enable row level security;
alter table tasks enable row level security;
alter table sop_rules enable row level security;
alter table agent_memory enable row level security;
alter table agent_actions enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'customers','properties','listings','calendar_events',
    'tasks','sop_rules','agent_memory','agent_actions'
  ])
  loop
    execute format(
      'drop policy if exists "owner_full_access" on %I;', t
    );
    execute format(
      'create policy "owner_full_access" on %I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t
    );
  end loop;
end $$;
