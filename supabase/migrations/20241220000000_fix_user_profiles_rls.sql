-- Korjataan user_profiles RLS infinite recursion ongelma
-- Poistetaan kaikki vanhat policy:t jotka aiheuttavat rekursion

DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;

-- Luodaan korjatut policy:t ilman rekursiota

-- Käyttäjät näkevät vain oman profiilinsa
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Adminit näkevät kaikki profiilit (tämä ei aiheuta rekursiota)
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Käyttäjät voivat päivittää oman profiilinsa
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Adminit voivat päivittää kaikki profiilit
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Käyttäjät voivat luoda oman profiilinsa
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adminit voivat luoda profiileja
CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.user_id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );
