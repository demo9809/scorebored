-- Link candidates to a team participation entry (for display only)
create table program_participant_members (
  id uuid default gen_random_uuid() primary key,
  program_participant_id uuid references program_participants(id) on delete cascade not null,
  candidate_id uuid references candidates(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) null,
  
  unique(program_participant_id, candidate_id)
);

-- RLS
alter table program_participant_members enable row level security;

create policy "Admins can do everything with members"
  on program_participant_members for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Public read access"
  on program_participant_members for select
  using (true);
