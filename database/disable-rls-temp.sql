-- Väliaikaisesti poista RLS testausta varten
-- Suorita tämä Supabase SQL Editorissa

-- Poista RLS user_profiles-taulukosta
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Poista RLS courses-taulukosta
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Poista RLS user_courses-taulukosta
ALTER TABLE user_courses DISABLE ROW LEVEL SECURITY;

-- Poista RLS course_sections-taulukosta
ALTER TABLE course_sections DISABLE ROW LEVEL SECURITY;

-- Poista RLS course_videos-taulukosta
ALTER TABLE course_videos DISABLE ROW LEVEL SECURITY;

-- Poista RLS user_progress-taulukosta
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY; 