-- Create a secure function to check if the user is an admin
-- SECURITY DEFINER bypasses RLS on the profiles table
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Clean up ALL existing policies on candidates to start fresh
drop policy if exists "Admins can insert candidates" on candidates;
drop policy if exists "Admins can update candidates" on candidates;
drop policy if exists "Admins can delete candidates" on candidates;
drop policy if exists "Everyone can read candidates" on candidates;
drop policy if exists "Admins can do everything with candidates" on candidates;
drop policy if exists "Admins can manage candidates" on candidates;
drop policy if exists "Candidates are viewable by everyone" on candidates;

-- Enable RLS
alter table candidates enable row level security;

-- Admin Policy using the secure function
create policy "Admins can manage candidates"
  on candidates for all
  using ( is_admin() );

-- Public Read Policy
create policy "Candidates are viewable by everyone"
  on candidates for select
  using (true);
