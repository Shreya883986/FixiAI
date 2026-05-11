alter table public.profiles alter column credits_remaining set default 2;

update public.profiles
set credits_remaining = least(credits_remaining, 2)
where plan = 'free';

alter table public.uploads add column if not exists completed_at timestamptz;
alter table public.uploads add column if not exists processing_time_ms int;
alter table public.uploads add column if not exists download_count int not null default 0;

create index if not exists uploads_completed_idx on public.uploads (completed_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, credits_remaining)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    2
  );

  insert into public.user_roles (user_id, role) values (new.id, 'user');

  insert into public.credit_events (user_id, delta, reason)
  values (new.id, 2, 'signup_bonus');

  return new;
end;
$$;
