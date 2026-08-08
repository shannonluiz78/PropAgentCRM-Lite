-- Run this once in Supabase SQL Editor. Adds a timestamp for when a
-- customer's status became closed/lost, so the agent (and you) can reason
-- about "how long ago did this close" for long-term re-engagement.

alter table customers
  add column if not exists closed_at timestamptz;
