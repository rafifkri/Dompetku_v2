create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  bio text not null default '',
  photo text not null default '',
  cover text not null default '',
  photo_scale real not null default 1,
  photo_x real not null default 0,
  photo_y real not null default 0,
  cover_scale real not null default 1,
  cover_x real not null default 0,
  cover_y real not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  ts bigint not null,
  type text not null check (type in ('income', 'expense')),
  amount integer not null check (amount > 0),
  cat text not null,
  sub text not null default '',
  date date not null,
  "desc" text not null default '',
  method text not null default 'Cash',
  primary key (user_id, id)
);

create table if not exists public.settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  primary key (user_id, key)
);

alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.settings enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.settings to authenticated;

drop policy if exists "profiles own row" on public.profiles;
drop policy if exists "transactions own rows" on public.transactions;
drop policy if exists "settings own rows" on public.settings;
create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "transactions own rows" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings own rows" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();
