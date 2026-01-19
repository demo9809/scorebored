-- Enable RLS on candidates if not already enabled (idempotent)
alter table candidates enable row level security;

-- Drop existing policies to avoid conflicts or stale logic
drop policy if exists "Admins can insert candidates" on candidates;
drop policy if exists "Admins can update candidates" on candidates;
drop policy if exists "Admins can delete candidates" on candidates;
drop policy if exists "Everyone can read candidates" on candidates;
drop policy if exists "Admins can do everything with candidates" on candidates;

-- Create comprehensive Admin policy
create policy "Admins can do everything with candidates"
  on candidates for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Create Public Read policy
create policy "Everyone can read candidates"
  on candidates for select
  using (true);
