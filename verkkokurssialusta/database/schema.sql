-- Totuusonrakkaus tietokantataulukot
-- Suorita tämä Supabase SQL Editorissa

-- 1. Käyttäjäprofiilit-taulukko
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role VARCHAR DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kurssit-taulukko
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_hours INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Käyttäjien kurssit-taulukko
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_until TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  UNIQUE(user_id, course_id)
);

-- 4. Kurssien osiot-taulukko
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Kurssien videot-taulukko
CREATE TABLE IF NOT EXISTS course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  video_url VARCHAR,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Käyttäjien edistyminen-taulukko
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES course_videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Indeksit suorituskyvyn parantamiseksi
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_section_id ON course_videos(section_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_video_id ON user_progress(video_id);

-- RLS (Row Level Security) käytäntöjen määrittely
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Käyttäjäprofiilit - käyttäjä näkee vain oman profiilinsa
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Ylläpitäjät voivat nähdä kaikki profiilit
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Kurssit - kaikki voivat nähdä aktiiviset kurssit
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (is_active = TRUE);

-- Käyttäjien kurssit - käyttäjä näkee vain omat kurssinsa
CREATE POLICY "Users can view own courses" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

-- Ylläpitäjät voivat nähdä kaikki käyttäjien kurssit
CREATE POLICY "Admins can view all user courses" ON user_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Kurssien osiot - näkyvät vain kurssin omistajille
CREATE POLICY "Course sections visible to course participants" ON course_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses uc
      WHERE uc.course_id = course_sections.course_id 
      AND uc.user_id = auth.uid()
      AND uc.status = 'active'
    )
  );

-- Kurssien videot - näkyvät vain kurssin omistajille
CREATE POLICY "Course videos visible to course participants" ON course_videos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_courses uc
      JOIN course_sections cs ON cs.course_id = uc.course_id
      WHERE cs.id = course_videos.section_id
      AND uc.user_id = auth.uid()
      AND uc.status = 'active'
    )
  );

-- Käyttäjien edistyminen - käyttäjä näkee vain oman edistymisensä
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Käyttäjien edistyminen - käyttäjä voi päivittää oman edistymisensä
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Käyttäjien edistyminen - käyttäjä voi lisätä oman edistymisensä
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lisää esimerkki kursseja
INSERT INTO courses (title, description, price, duration_hours) VALUES
('Totuus on rakkaus - Perusteet', 'Syvällinen kurssi rakkauden ja totuuden ymmärtämiseen. Tämä peruskurssi opettaa sinua näkemään maailman uusilla silmillä.', 99.00, 10),
('Syvempi ymmärrys', 'Lisäkurssi, joka syventää perusteita ja avaa uusia näkökulmia rakkauden filosofiaan.', 149.00, 15)
ON CONFLICT DO NOTHING; 