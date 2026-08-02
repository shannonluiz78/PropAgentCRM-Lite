-- Run this once in Supabase SQL Editor. A listing must always belong to a
-- property (matches the confirmed workflow: a listing only gets created
-- once there's a property to market). Safe to run on an empty listings table.

alter table listings
  alter column property_id set not null;
