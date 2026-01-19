-- Add year and department columns to candidates table
alter table candidates 
add column if not exists year text,
add column if not exists department text;
