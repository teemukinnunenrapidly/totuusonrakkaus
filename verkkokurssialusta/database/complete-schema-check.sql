-- Tietokantatarkistus ja korjauskomennot
-- Suorita tämä Supabase SQL Editorissa vaiheittain

-- 1. TARKISTA TAULUT
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY table_name;

-- 2. TARKISTA SARAKKEET JOKAISESSA TAULUSSA
-- user_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- courses
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- course_sections
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'course_sections'
ORDER BY ordinal_position;

-- course_videos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'course_videos'
ORDER BY ordinal_position;

-- user_courses
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_courses'
ORDER BY ordinal_position;

-- user_progress
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;

-- 3. TARKISTA INDEKSIT
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY tablename, indexname;

-- 4. TARKISTA RLS KÄYTÄNNÖT
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY tablename, policyname;

-- 5. KORJAUSKOMENNOT (suorita vain jos tarvitaan)

-- Jos updated_at puuttuu course_sections:sta
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Jos updated_at puuttuu course_videos:sta  
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Jos updated_at puuttuu user_courses:sta
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Jos updated_at puuttuu user_progress:sta
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Jos order_index puuttuu course_sections:sta
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Jos order_index puuttuu course_videos:sta
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Jos downloadable_materials puuttuu course_sections:sta
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS downloadable_materials TEXT[] DEFAULT '{}';

-- Jos content puuttuu course_sections:sta
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS content TEXT;

-- Jos vimeo_url puuttuu course_sections:sta
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS vimeo_url TEXT;

-- 6. PÄIVITÄ OLEMASSA OLEVAT TIEDOT
-- Päivitä order_index olemassa oleville osioille
UPDATE course_sections 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) as row_number
  FROM course_sections
) as subquery 
WHERE course_sections.id = subquery.id;

-- Päivitä order_index olemassa oleville videoille
UPDATE course_videos 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) as row_number
  FROM course_videos
) as subquery 
WHERE course_videos.id = subquery.id;

-- 7. TARKISTA ESIMERKKIKURSSIT
SELECT * FROM courses;

-- 8. TARKISTA KÄYTTÄJÄPROFIILIT
SELECT * FROM user_profiles;

-- 9. TARKISTA RLS ON KÄYTÖSSÄ
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY tablename;
