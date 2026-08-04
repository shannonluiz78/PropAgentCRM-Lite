-- Run this once in Supabase SQL Editor. Adds four small fields used by the
-- quick-win updates: tenure/lease info on properties, exclusive mandate
-- tracking on listings. Safe to run on existing data — all new columns are
-- nullable or have sensible defaults.

alter table properties
  add column if not exists tenure text
  check (tenure in ('freehold','99_leasehold','999_leasehold'));

alter table properties
  add column if not exists lease_remaining_years int;

alter table listings
  add column if not exists is_exclusive boolean not null default false;

alter table listings
  add column if not exists exclusive_expiry date;
