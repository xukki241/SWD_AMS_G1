-- Seed submissions used fake Cloudinary URLs (files never uploaded) → 404 on download.
-- Point them at the local demo file endpoint instead.
UPDATE submissions
SET secure_file_reference =
    'http://localhost:8080/api/files/demo/' ||
    regexp_replace(secure_file_reference, '^.*/', '')
WHERE secure_file_reference LIKE '%res.cloudinary.com/%/submissions/%';
