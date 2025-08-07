-- Korjaa RLS-käytännöt
-- Suorita tämä Supabase SQL Editorissa

-- 1. OTA RLS KÄYTÖÖN
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 2. POISTA VANHAT KÄYTÄNNÖT (jos olemassa)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;

DROP POLICY IF EXISTS "Anyone can view active course sections" ON course_sections;
DROP POLICY IF EXISTS "Admins can insert sections" ON course_sections;
DROP POLICY IF EXISTS "Admins can update sections" ON course_sections;

DROP POLICY IF EXISTS "Users can view own courses" ON user_courses;
DROP POLICY IF EXISTS "Admins can insert user courses" ON user_courses;
DROP POLICY IF EXISTS "Admins can update user courses" ON user_courses;

DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

-- 3. LUO UUDET KÄYTÄNNÖT

-- Käyttäjäprofiilit
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Kurssit
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = true OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can insert courses" ON courses
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update courses" ON courses
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Kurssien osiot
CREATE POLICY "Anyone can view active course sections" ON course_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_sections.course_id AND c.is_active = true
        ) OR EXISTS (
            SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert sections" ON course_sections
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update sections" ON course_sections
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Käyttäjien kurssit
CREATE POLICY "Users can view own courses" ON user_courses
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can insert user courses" ON user_courses
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can update user courses" ON user_courses
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Käyttäjien edistyminen
CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON user_progress
    FOR UPDATE USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- 4. TARKISTA RLS ON KÄYTÖSSÄ
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY tablename;

-- 5. TARKISTA KÄYTÄNNÖT
SELECT schemaname, tablename, policyname
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'courses', 'course_sections', 'course_videos', 'user_courses', 'user_progress')
ORDER BY tablename, policyname; 