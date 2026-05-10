create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "users read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  plan text not null default 'free',
  credits_remaining int not null default 5,
  credits_reset_at timestamptz not null default (now() + interval '1 day'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_path text not null,
  result_path text,
  original_filename text,
  file_size_bytes int,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.uploads enable row level security;

create policy "read own uploads" on public.uploads
  for select to authenticated using (user_id = auth.uid());

create policy "insert own uploads" on public.uploads
  for insert to authenticated with check (user_id = auth.uid());

create policy "update own uploads" on public.uploads
  for update to authenticated using (user_id = auth.uid());

create policy "delete own uploads" on public.uploads
  for delete to authenticated using (user_id = auth.uid());

create index uploads_user_created_idx on public.uploads (user_id, created_at desc);
create index uploads_expires_idx on public.uploads (expires_at);

create table public.credit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  reason text not null,
  upload_id uuid references public.uploads(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.credit_events enable row level security;
create policy "read own credits" on public.credit_events
  for select to authenticated using (user_id = auth.uid());

create index credit_events_user_idx on public.credit_events (user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  insert into public.credit_events (user_id, delta, reason)
  values (new.id, 5, 'signup_bonus');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('snapcut-images', 'snapcut-images', true)
on conflict (id) do nothing;

create policy "users read own images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'snapcut-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "public read processed images"
  on storage.objects for select
  to anon
  using (bucket_id = 'snapcut-images');

create policy "users upload own images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'snapcut-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'snapcut-images' and (storage.foldername(name))[1] = auth.uid()::text);