-- Supabase table definitions for Earn Ethiopia (v2)
create table users (
  id uuid primary key,
  email text unique,
  full_name text,
  points int default 0
);

create table tasks (
  id uuid primary key,
  title text,
  link text,
  reward int
);

create table announcements (
  id uuid primary key,
  content text,
  created_at timestamp default now()
);

create table referrals (
  id uuid primary key,
  user_id uuid references users(id),
  referred_email text
);

create table withdrawals (
  id uuid primary key,
  user_id uuid references users(id),
  telebirr_name text,
  telebirr_number text,
  amount int,
  status text default 'pending'
);

-- Create storage bucket 'screenshots' (run in Supabase UI or via API)
