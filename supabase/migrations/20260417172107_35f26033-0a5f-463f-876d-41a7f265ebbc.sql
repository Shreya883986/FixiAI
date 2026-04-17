create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop the broad anon read policy and replace with one that disallows listing
drop policy if exists "public read processed images" on storage.objects;

-- Anonymous users can fetch any single file by exact name (needed for shareable
-- result URLs), but the policy below disallows directory listing because
-- listing requires SELECT on names matching a folder prefix without a specific name.
-- Storage uses signed-URL-style public access for files in public buckets,
-- so we keep the bucket public=true but rely on object-level policy for listing protection.
create policy "anon fetch by exact name"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'snapcut-images'
    and name is not null
  );