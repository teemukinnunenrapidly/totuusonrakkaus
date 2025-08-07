# Totuusonrakkaus

Totuusonrakkaus on moderni online-learning platform, joka on rakennettu Next.js:llä ja Supabase:lla.

## Teknologiapino

- **Frontend**: Next.js 14 (App Router)
- **UI**: HeroUI (aiemmin NextUI)
- **Tyylit**: Tailwind CSS
- **Käyttäjähallinta**: Supabase Auth
- **Tietokanta**: Supabase PostgreSQL
- **Lomakkeet**: React Hook Form + Zod
- **Ikonit**: Lucide React

## Asennus

1. Kloonaa projekti
```bash
git clone <repository-url>
cd totuusonrakkaus
```

2. Asenna riippuvuudet
```bash
npm install
```

3. Luo `.env.local` tiedosto ja lisää Supabase-konfiguraatio
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Käynnistä kehityspalvelin
```bash
npm run dev
```

## Käyttäjätarinat

### Käyttäjätarina 1: Rekisteröityminen ja kirjautuminen ✅
- **Rekisteröityminen**: Käyttäjä voi rekisteröityä sähköpostilla ja salasanalla
  - Sähköpostin validointi
  - Salasanan minimipituus 8 merkkiä
  - Onnistumisviesti tai virheilmoitus
- **Kirjautuminen**: Käyttäjä voi kirjautua sisään
  - Molemmat kentät pakollisia
  - Virheilmoitus väärillä tunnuksilla
  - Ohjaus /omat-kurssit-sivulle onnistuneen kirjautumisen jälkeen
  - Linkit rekisteröitymiseen ja salasanan palautukseen

## Kehitys

### Projektin rakenne
```
src/
├── app/
│   ├── kirjaudu/
│   │   └── page.tsx          # Kirjautumissivu
│   ├── omat-kurssit/
│   │   └── page.tsx          # Kurssisivu (placeholder)
│   ├── rekisteroidy/
│   │   └── page.tsx          # Rekisteröitymissivu
│   ├── unohdin-salasanan/
│   │   └── page.tsx          # Salasanan palautus (placeholder)
│   ├── layout.tsx            # Pääasettelu
│   ├── page.tsx              # Etusivu
│   └── providers.tsx         # HeroUI provider
├── lib/
│   └── supabase.ts           # Supabase-konfiguraatio
```

### Koodauskäytännöt
- Käytä TypeScriptiä kaikkialla
- Käytä React Hook Formia ja Zodia lomakkeissa
- Käytä HeroUI-komponentteja UI:ssa
- Käytä Lucide React -ikoneita
- Tallenna ympäristömuuttujat .env.local-tiedostoon

## Lisenssi

MIT
