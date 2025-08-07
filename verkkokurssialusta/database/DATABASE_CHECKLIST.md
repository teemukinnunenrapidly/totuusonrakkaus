# Tietokantatarkistuslista

## 🔍 Tarkistettavat asiat Supabasessa

### 1. TAULUT
- [ ] `user_profiles` - käyttäjäprofiilit
- [ ] `courses` - kurssit  
- [ ] `course_sections` - kurssien osiot
- [ ] `course_videos` - kurssien videot
- [ ] `user_courses` - käyttäjien kurssit
- [ ] `user_progress` - käyttäjien edistyminen

### 2. SARAKKEET - user_profiles
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `user_id` (UUID, REFERENCES auth.users)
- [ ] `role` (TEXT, 'admin' tai 'student')
- [ ] `created_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE)

### 3. SARAKKEET - courses
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `title` (TEXT, NOT NULL)
- [ ] `description` (TEXT)
- [ ] `price` (DECIMAL(10,2))
- [ ] `duration_hours` (INTEGER)
- [ ] `is_active` (BOOLEAN, DEFAULT false)
- [ ] `created_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE)

### 4. SARAKKEET - course_sections
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `course_id` (UUID, REFERENCES courses)
- [ ] `title` (TEXT, NOT NULL)
- [ ] `content` (TEXT) ⚠️ **TÄRKEÄ**
- [ ] `vimeo_url` (TEXT) ⚠️ **TÄRKEÄ**
- [ ] `downloadable_materials` (TEXT[]) ⚠️ **TÄRKEÄ**
- [ ] `order_index` (INTEGER, NOT NULL) ⚠️ **TÄRKEÄ**
- [ ] `created_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **TÄRKEÄ**

### 5. SARAKKEET - course_videos
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `section_id` (UUID, REFERENCES course_sections)
- [ ] `title` (TEXT, NOT NULL)
- [ ] `description` (TEXT)
- [ ] `video_url` (TEXT)
- [ ] `duration_seconds` (INTEGER)
- [ ] `order_index` (INTEGER, NOT NULL) ⚠️ **TÄRKEÄ**
- [ ] `created_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **TÄRKEÄ**

### 6. SARAKKEET - user_courses
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `user_id` (UUID, REFERENCES auth.users)
- [ ] `course_id` (UUID, REFERENCES courses)
- [ ] `enrolled_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `access_until` (TIMESTAMP WITH TIME ZONE)
- [ ] `status` (TEXT, 'active', 'expired', 'cancelled')
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **TÄRKEÄ**

### 7. SARAKKEET - user_progress
- [ ] `id` (UUID, PRIMARY KEY)
- [ ] `user_id` (UUID, REFERENCES auth.users)
- [ ] `video_id` (UUID, REFERENCES course_videos)
- [ ] `watched_seconds` (INTEGER, DEFAULT 0)
- [ ] `completed` (BOOLEAN, DEFAULT false)
- [ ] `last_watched_at` (TIMESTAMP WITH TIME ZONE)
- [ ] `updated_at` (TIMESTAMP WITH TIME ZONE) ⚠️ **TÄRKEÄ**

### 8. INDEKSIT
- [ ] `idx_user_profiles_user_id`
- [ ] `idx_courses_is_active`
- [ ] `idx_course_sections_course_id`
- [ ] `idx_course_sections_order_index`
- [ ] `idx_course_videos_section_id`
- [ ] `idx_course_videos_order_index`
- [ ] `idx_user_courses_user_id`
- [ ] `idx_user_courses_course_id`
- [ ] `idx_user_courses_status`
- [ ] `idx_user_progress_user_id`
- [ ] `idx_user_progress_video_id`

### 9. RLS KÄYTÄNNÖT
- [ ] `user_profiles` - RLS käytössä
- [ ] `courses` - RLS käytössä
- [ ] `course_sections` - RLS käytössä
- [ ] `course_videos` - RLS käytössä
- [ ] `user_courses` - RLS käytössä
- [ ] `user_progress` - RLS käytössä

### 10. ESIMERKKIDATAA
- [ ] Vähintään 2 esimerkkikurssia `courses`-taulussa
- [ ] Vähintään 1 admin-käyttäjä `user_profiles`-taulussa

## 🚨 YLEISIMMÄT ONGELMAT

### Puuttuvat sarakkeet:
1. **`course_sections.updated_at`** - aiheuttaa virheitä osion päivityksessä
2. **`course_sections.content`** - WYSIWYG editor ei toimi ilman tätä
3. **`course_sections.vimeo_url`** - video URL:t eivät tallennu
4. **`course_sections.downloadable_materials`** - ladattavat materiaalit eivät toimi
5. **`course_sections.order_index`** - drag & drop ei toimi
6. **`course_videos.order_index`** - videoiden järjestys ei toimi

### RLS ongelmat:
- Jos RLS on liian tiukka, admin-toiminnot eivät toimi
- Jos RLS on pois päältä, tietoturva on heikko

## 🔧 KORJAUSKOMENNOT

### Nopea korjaus:
```sql
-- Suorita tämä ensin
\i database/quick-fix.sql
```

### Tarkka tarkistus:
```sql
-- Suorita tämä tarkistusta varten
\i database/complete-schema-check.sql
```

### Jos RLS aiheuttaa ongelmia:
```sql
-- Väliaikainen RLS pois päältä (vain kehityksessä!)
\i database/disable-rls-completely.sql
```

## ✅ TARKISTUSLISTA

1. **Suorita `quick-fix.sql`** Supabase SQL Editorissa
2. **Tarkista että kaikki sarakkeet ovat olemassa**
3. **Testaa admin-toiminnot** (kurssin lisäys, osion muokkaus)
4. **Testaa drag & drop** osioiden järjestämisessä
5. **Testaa WYSIWYG editor** sisällön muokkauksessa
6. **Tarkista että RLS toimii** oikein

## 📝 MUISTUTUKSET

- **RLS on tärkeä tietoturvan kannalta** - älä jätä pois päältä tuotannossa
- **`order_index` on pakollinen** drag & drop -toiminnolle
- **`updated_at` on pakollinen** "Päivitetty viimeksi" -metadatalle
- **`content` on pakollinen** WYSIWYG editorille
- **Testaa aina muutosten jälkeen** että kaikki toimii
