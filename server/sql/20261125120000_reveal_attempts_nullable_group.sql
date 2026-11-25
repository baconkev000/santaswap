-- Allow phone-lookup rate-limit rows that are not tied to a specific exchange
-- (used when someone checks a number that isn't in any exchange yet).
alter table assignment_reveal_attempts
  alter column group_id drop not null;
