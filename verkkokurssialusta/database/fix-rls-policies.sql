-- Korjaa RLS-käytännöt user_profiles-taulukkoon
-- Suorita tämä Supabase SQL Editorissa

-- Poista vanhat käytännöt
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;

-- Lisää uudet käytännöt
-- Kaikki voivat nähdä omat profiilinsa
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Kaikki voivat päivittää omat profiilinsa
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Kaikki voivat luoda omat profiilinsa
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ylläpitäjät voivat nähdä kaikki profiilit
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ylläpitäjät voivat päivittää kaikki profiilit
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ylläpitäjät voivat luoda profiileja
CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Lisää myös käytännöt muille taulukoille
-- Kurssit - kaikki voivat nähdä aktiiviset kurssit
CREATE POLICY "Anyone can view active courses" ON courses
  FOR SELECT USING (is_active = TRUE);

-- Käyttäjien kurssit - käyttäjä näkee vain omat kurssinsa
CREATE POLICY "Users can view own courses" ON user_courses
  FOR SELECT USING (auth.uid() = user_id);

-- Käyttäjien kurssit - käyttäjä voi lisätä omat kurssinsa
CREATE POLICY "Users can insert own courses" ON user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Käyttäjien kurssit - käyttäjä voi päivittää omat kurssinsa
CREATE POLICY "Users can update own courses" ON user_courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Ylläpitäjät voivat nähdä kaikki käyttäjien kurssit
CREATE POLICY "Admins can view all user courses" ON user_courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ylläpitäjät voivat lisätä käyttäjien kursseja
CREATE POLICY "Admins can insert user courses" ON user_courses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ylläpitäjät voivat päivittää käyttäjien kursseja
CREATE POLICY "Admins can update user courses" ON user_courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ); 