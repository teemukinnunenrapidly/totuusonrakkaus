-- Lisää updated_at sarakkeet tietokantatauluihin
-- Suorita tämä Supabase SQL Editorissa

-- Lisää updated_at course_sections-tauluun
ALTER TABLE course_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Lisää updated_at course_videos-tauluun
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Lisää updated_at user_courses-tauluun
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Lisää updated_at user_progress-tauluun
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tarkista sarakkeet
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('course_sections', 'course_videos', 'user_courses', 'user_progress')
AND column_name = 'updated_at'
ORDER BY table_name; 