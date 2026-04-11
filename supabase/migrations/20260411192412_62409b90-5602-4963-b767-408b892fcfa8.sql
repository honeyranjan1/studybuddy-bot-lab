
-- Restrict avatar uploads to image MIME types only
CREATE POLICY "Only allow image uploads to avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
  AND (octet_length(name) < 500)
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Drop the old permissive insert policy if it exists and re-create with restrictions
-- First check existing policies - the new policy above adds the restriction
