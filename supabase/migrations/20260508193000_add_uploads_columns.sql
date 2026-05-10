alter table public.uploads add column if not exists completed_at timestamptz;
alter table public.uploads add column if not exists processing_time_ms int;
alter table public.uploads add column if not exists download_count int not null default 0;

create index if not exists uploads_completed_idx on public.uploads (completed_at desc);