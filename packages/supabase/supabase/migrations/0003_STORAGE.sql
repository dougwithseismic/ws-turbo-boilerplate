-- Create the storage bucket if it doesn't exist
INSERT INTO
    storage.buckets (id, name, public, file_size_limit)
SELECT
    'assets',
    'assets',
    false,
    1073741824 -- 1 GB limit, adjust as needed
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            storage.buckets
        WHERE
            id = 'assets'
    );

-- Enable Row Level Security (RLS) for the storage objects
ALTER TABLE
    storage.objects ENABLE ROW LEVEL SECURITY;

-- Clear existing policies (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users CRUD on own folder" ON storage.objects;

DROP POLICY IF EXISTS "Deprecated: Users can upload files to their own folder" ON storage.objects;

-- Clean up old names if used
DROP POLICY IF EXISTS "Deprecated: Users can read their own files" ON storage.objects;

DROP POLICY IF EXISTS "Deprecated: Users can update their own files" ON storage.objects;

DROP POLICY IF EXISTS "Deprecated: Users can delete their own files" ON storage.objects;

-- Create a single policy granting authenticated users full access (CRUD) to objects
-- within their own user-specific folder (e.g., assets/user_id/*)
CREATE POLICY "Allow authenticated users CRUD on own folder" ON storage.objects FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
USING (
    auth.role() = 'authenticated'
    AND bucket_id = 'assets'
    AND (storage.foldername(name)) [ 1 ] = auth.uid() :: text -- Checks if the first folder component is the user's ID
) WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id = 'assets'
    AND (storage.foldername(name)) [ 1 ] = auth.uid() :: text
);

COMMENT ON POLICY "Allow authenticated users CRUD on own folder" ON storage.objects IS 'Authenticated users can manage files within their own folder assets/{user_id}/';