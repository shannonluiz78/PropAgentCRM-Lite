-- Run this once in Supabase SQL Editor. Updates the properties table you
-- already created to match the confirmed workflow: every property must be
-- linked to an owning customer, and property_type is locked to a fixed list.
-- Safe to run even though the properties table is currently empty.

alter table properties
  add constraint properties_type_check
  check (property_type in ('hdb','condo','ec','landed'));

alter table properties
  alter column owner_customer_id set not null;

alter table properties
  drop constraint if exists properties_owner_customer_id_fkey;

alter table properties
  add constraint properties_owner_customer_id_fkey
  foreign key (owner_customer_id) references customers(id) on delete restrict;
