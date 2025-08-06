-- Lisää order_index sarakkeet tietokantatauluihin
-- Suorita tämä Supabase SQL Editorissa

-- Lisää order_index course_sections-tauluun
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Lisää order_index course_videos-tauluun
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Päivitä olemassa olevat osiot järjestyksessä
UPDATE course_sections 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) as row_number
  FROM course_sections
) as subquery 
WHERE course_sections.id = subquery.id;

-- Päivitä olemassa olevat videot järjestyksessä
UPDATE course_videos 
SET order_index = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) as row_number
  FROM course_videos
) as subquery 
WHERE course_videos.id = subquery.id;

-- Tarkista sarakkeet
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('course_sections', 'course_videos')
AND column_name = 'order_index'
ORDER BY table_name; 