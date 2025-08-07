-- Nopeat korjauskomennot - suorita tämä ensin
-- Tämä lisää puuttuvat sarakkeet ja korjaa yleisimmät ongelmat

-- 1. Lisää puuttuvat sarakkeet
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS downloadable_materials TEXT[] DEFAULT '{}';
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS vimeo_url TEXT;

ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Päivitä järjestys
UPDATE course_sections 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) as row_number
  FROM course_sections
) as subquery 
WHERE course_sections.id = subquery.id;

UPDATE course_videos 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) as row_number
  FROM course_videos
) as subquery 
WHERE course_videos.id = subquery.id;

-- 3. Tarkista että kaikki on kunnossa
SELECT 'course_sections' as table_name, COUNT(*) as row_count FROM course_sections
UNION ALL
SELECT 'course_videos' as table_name, COUNT(*) as row_count FROM course_videos
UNION ALL
SELECT 'courses' as table_name, COUNT(*) as row_count FROM courses
UNION ALL
SELECT 'user_profiles' as table_name, COUNT(*) as row_count FROM user_profiles;
