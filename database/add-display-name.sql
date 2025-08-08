-- Add display_name field to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add index for display_name for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- Update RLS policies to include display_name
-- (The existing policies should work fine with the new field)
