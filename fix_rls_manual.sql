-- MANUAALINEN KORJAUS RLS INFINITE RECURSION ONGELMAAN
-- Suorita tämä Supabase Dashboard:sta SQL Editor:issa

-- VAIHE 1: Poista vanhat policy:t
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;

-- VAIHE 2: Poista RLS väliaikaisesti (vaihtoehto)
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- VAIHE 3: Luo yksinkertainen policy joka sallii kaikki operaatiot
CREATE POLICY "Allow all operations temporarily" ON user_profiles
  FOR ALL USING (true);

-- VAIHE 4: Testaa että tietokanta toimii
-- SELECT COUNT(*) FROM user_profiles;
