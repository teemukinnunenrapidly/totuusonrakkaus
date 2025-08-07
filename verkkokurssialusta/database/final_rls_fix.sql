-- FINAALI RLS KORJAUS - Suorita tämä Supabase SQL Editor:issa

-- VAIHE 1: Poistetaan kaikki vanhat policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations temporarily" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations" ON user_profiles;

-- VAIHE 2: Poistetaan RLS kokonaan väliaikaisesti
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- VAIHE 3: Testataan että tietokanta toimii
SELECT COUNT(*) FROM user_profiles;

-- VAIHE 4: Jos haluat palauttaa RLS myöhemmin, käytä tätä:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations" ON user_profiles FOR ALL USING (true);
