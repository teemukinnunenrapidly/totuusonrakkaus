-- Tietokantaskeema Totuusonrakkaus-sovellukselle

-- Käyttäjäprofiilit
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Kurssit
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_hours INTEGER,
    is_active BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Kurssien osiot
CREATE TABLE IF NOT EXISTS course_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    vimeo_url TEXT,
    downloadable_materials TEXT[] DEFAULT '{}',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Kurssien videot
CREATE TABLE IF NOT EXISTS course_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration_seconds INTEGER,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Käyttäjien kurssit
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    access_until TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- Käyttäjien edistyminen
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES course_videos(id) ON DELETE CASCADE NOT NULL,
    watched_seconds INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, video_id)
);

-- Indeksit suorituskyvyn parantamiseksi
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_order_index ON course_sections(order_index);
CREATE INDEX IF NOT EXISTS idx_course_videos_section_id ON course_videos(section_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_order_index ON course_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_status ON user_courses(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON user_progress(video_id);

-- RLS (Row Level Security) käytäntöjä
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Käyttäjäprofiilit: käyttäjät voivat nähdä ja muokata omia profiilejaan, adminit kaikki
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

-- Kurssit: kaikki voivat nähdä aktiiviset kurssit, adminit kaikki
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

-- Kurssien osiot: kaikki voivat nähdä aktiivisten kurssien osiot, adminit kaikki
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

-- Käyttäjien kurssit: käyttäjät voivat nähdä omat kurssinsa, adminit kaikki
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

-- Käyttäjien edistyminen: käyttäjät voivat nähdä ja muokata omaa edistymistään
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

-- Esimerkkikurssit
INSERT INTO courses (title, description, price, duration_hours, is_active) VALUES
('Totuus on rakkaus - Perusteet', 'Syvällinen kurssi rakkauden ja totuuden ymmärtämiseen. Tämä peruskurssi opettaa sinua näkemään maailman uusilla silmillä.', 99, 10, true),
('Syvempi ymmärrys', 'Lisäkurssi, joka syventää perusteita ja avaa uusia näkökulmia rakkauden filosofiaan.', 149, 15, true)
ON CONFLICT DO NOTHING; 