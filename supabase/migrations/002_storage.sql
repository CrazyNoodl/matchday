-- =============================================================================
-- Matchday — media storage bucket
-- =============================================================================

-- Create bucket (public so URLs work without auth token)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'match-media',
  'match-media',
  true,
  52428800,  -- 50 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Users can upload only to their own folder: {userId}/...
create policy "match-media: upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'match-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/delete only their own files
create policy "match-media: update own files"
  on storage.objects for update
  using (
    bucket_id = 'match-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "match-media: delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'match-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read — anyone with the URL can view
create policy "match-media: public read"
  on storage.objects for select
  using (bucket_id = 'match-media');
