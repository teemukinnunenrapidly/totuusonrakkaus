-- Tarkista sarakkeet kaikissa tauluissa
-- Suorita tämä Supabase SQL Editorissa

-- 1. TARKISTA course_sections SARAKKEET
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'course_sections'
ORDER BY ordinal_position;

-- 2. TARKISTA courses SARAKKEET  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- 3. TARKISTA user_profiles SARAKKEET
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. TARKISTA PUUTTUVAT SARAKKEET
-- Jos näissä on NULL, sarake puuttuu
SELECT 
  'course_sections.content' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'content'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_sections.vimeo_url' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'vimeo_url'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_sections.downloadable_materials' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'downloadable_materials'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_sections.order_index' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'order_index'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_sections.updated_at' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'updated_at'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_videos.order_index' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_videos' AND column_name = 'order_index'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'course_videos.updated_at' as column_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_videos' AND column_name = 'updated_at'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 5. TARKISTA ESIMERKKIDATAA
SELECT 'courses' as table_name, COUNT(*) as row_count FROM courses
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles
UNION ALL
SELECT 'course_sections' as table_name, COUNT(*) as row_count FROM course_sections;

-- 6. TARKISTA INDEKSIT
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('course_sections', 'course_videos', 'courses', 'user_profiles')
ORDER BY tablename, indexname;
