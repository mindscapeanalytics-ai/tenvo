-- Check what columns actually exist on affiliates
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'affiliates'
ORDER BY ordinal_position;
