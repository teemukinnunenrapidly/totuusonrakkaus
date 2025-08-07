-- Poista RLS kaikista tauluista väliaikaisesti
-- Suorita tämä Supabase SQL Editorissa

-- Poista RLS user_profiles-taulusta
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Poista RLS courses-taulusta  
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Poista RLS course_sections-taulusta
ALTER TABLE course_sections DISABLE ROW LEVEL SECURITY;

-- Poista RLS course_videos-taulusta
ALTER TABLE course_videos DISABLE ROW LEVEL SECURITY;

-- Poista RLS user_courses-taulusta
ALTER TABLE user_courses DISABLE ROW LEVEL SECURITY;

-- Poista RLS user_progress-taulusta
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;

-- Tarkista RLS-tila
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress'); 