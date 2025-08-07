-- Korjaa course_sections-taulu lisäämällä puuttuvat sarakkeet
-- Suorita tämä Supabase SQL Editorissa

-- Lisää content-sarakkeet jos niitä ei ole
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS vimeo_url TEXT;
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS downloadable_materials TEXT[] DEFAULT '{}';

-- Tarkista taulun rakenne
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_sections' 
ORDER BY ordinal_position; 