# Kommentointitoiminto

## Yleiskatsaus

Kurssialustalle on lisätty kommentointitoiminto, joka mahdollistaa käyttäjien keskustelun kurssien ja osioiden ympärillä.

## Toiminnallisuudet

### ✅ Toteutetut toiminnallisuudet

1. **Kommenttien näyttäminen**
   - Kommentit näkyvät kurssisivun alaosassa
   - Järjestetty aikajärjestyksessä (uusimmat ensin)
   - Näyttää käyttäjän nimen, aikaleiman ja sisällön
   - **Avatar-generaattori** - uniikit avatareja käyttäjille

2. **Uuden kommentin lisäys**
   - Kirjautuneet käyttäjät voivat lisätä kommentteja
   - Tekstikenttä kommentin kirjoittamiseen
   - Lähetysnappi kommentin tallentamiseen
   - **Anonyymi kommentointi** - valinta kommentoida anonyymisti tai omalla nimellä

3. **Kommentin muokkaus**
   - Kommentin kirjoittaja voi muokata omaa kommenttiaan
   - Muokkaushistoria näkyy kommentissa

4. **Kommentin poisto**
   - Kommentin kirjoittaja voi poistaa oman kommenttinsa
   - **Admin-toiminnot** - adminit voivat poistaa kaikki kommentit
   - Admin-poisto näkyy selkeästi "(Admin)" -merkillä

5. **Vastaukset kommenteille**
   - Käyttäjät voivat vastata kommenteille
   - Vastaukset näkyvät alkuperäisen kommentin alla
   - Sisäkkäinen rakenne

6. **Käyttäjäkohtaiset ominaisuudet**
   - **Avatar-generaattori** - uniikit värikoodatut avatareja
   - **Admin-merkit** - selkeät admin-tagit kommenteissa
   - Käyttäjänimi näkyy kommenteissa
   - **Anonyymi kommentointi** - "Anonyymi" -nimimerkki

### 🔧 Tekninen toteutus

#### Komponentit
- `CommentSection` - Pääkomponentti kommentointitoiminnolle
- `src/app/api/comments/route.ts` - API-endpoint kommenttien käsittelyyn
- `src/lib/avatarGenerator.ts` - Avatar-generaattori

#### API-endpointit
- `GET /api/comments` - Kommenttien hakeminen
- `POST /api/comments` - Uuden kommentin lisäys

#### Avatar-generaattori
- Uniikit värikoodatut avatareja käyttäjille
- Perustuu käyttäjän email/ID:hen
- SVG-pohjaiset avatareja
- 16 eri väriyhdistelmää

#### Admin-toiminnot
- Admin-tunnistus email-osoitteen perusteella
- Adminit voivat poistaa kaikki kommentit
- Selkeät admin-tagit kommenteissa
- Admin-poisto näkyy "(Admin)" -merkillä

#### Anonyymi kommentointi
- Radiobutton-valinta kommentin lisäyskentässä
- "Omalla nimelläsi" vs "Anonyymisti"
- Anonyymit kommentit näkyvät "Anonyymi" -nimimerkillä
- Admin-tagit eivät näy anonyymeissä kommenteissa

#### Tietokantarakenne (suunniteltu)
```sql
CREATE TABLE course_comments (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    section_id UUID REFERENCES course_sections(id),
    user_id UUID REFERENCES auth.users(id),
    parent_comment_id UUID REFERENCES course_comments(id),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 🎨 UI/UX Ominaisuudet

1. **Moderni design**
   - HeroUI-komponentit
   - Responsive design
   - Selkeä typografia

2. **Käyttäjäystävällinen**
   - Intuitiivinen käyttöliittymä
   - Selkeät toimintopainikkeet
   - Loading-tilat
   - Radiobutton-valinta kommentin tyypille

3. **Accessibility**
   - ARIA-labelit
   - Keyboard navigation
   - Screen reader -ystävällinen

### 🔒 Turvallisuus

1. **Autentikaatio**
   - Vain kirjautuneet käyttäjät voivat kommentoida
   - Sessioiden tarkistus API-kutsuissa

2. **Autorisaatio**
   - Käyttäjät voivat muokata vain omia kommenttejaan
   - Adminit voivat poistaa kaikki kommentit
   - Admin-tunnistus email-osoitteen perusteella

3. **Anonyymi kommentointi**
   - Käyttäjän henkilötiedot piilotetaan
   - Admin-tagit eivät näy anonyymeissä kommenteissa
   - Sisäinen kirjaus säilyy moderointia varten

### 📱 Responsive Design

- Toimii mobiililaitteilla
- Tablet-ystävällinen
- Desktop-optimized

## Käyttöohjeet

### Kommentin lisäys
1. Siirry kurssisivulle
2. Vieritä alas kommenttiosioon
3. Valitse kommentin tyyppi:
   - **"Omalla nimelläsi"** - kommentti näkyy omalla nimelläsi
   - **"Anonyymisti"** - kommentti näkyy "Anonyymi" -nimimerkillä
4. Kirjoita kommenttisi tekstikenttään
5. Klikkaa "Lähetä"-nappia

### Kommentin muokkaus
1. Klikkaa kolmea pistettä kommentin vieressä
2. Valitse "Muokkaa"
3. Muokkaa tekstiä
4. Klikkaa "Tallenna"

### Kommentin poisto
1. Klikkaa kolmea pistettä kommentin vieressä
2. Valitse "Poista" tai "Poista kommentti (Admin)"
3. Vahvista poisto

### Vastaus kommentille
1. Klikkaa "Vastaa"-nappia kommentin alla
2. Kirjoita vastauksesi
3. Klikkaa "Lähetä vastaus"

### Admin-toiminnot
- **Admin-tunnistus**: Käyttäjät, joiden email sisältää "admin"
- **Admin-tagit**: Siniset "Admin" -merkit kommenteissa
- **Poisto-oikeudet**: Adminit voivat poistaa kaikki kommentit
- **Admin-poisto**: Näkyy "(Admin)" -merkillä dropdown-valikossa

## Tulevat parannukset

### 🔮 Suunnitellut ominaisuudet

1. **Realtime-päivitykset**
   - WebSocket-yhteys kommenttien päivityksiin
   - Instant notifications

2. **Rikasteempi sisältö**
   - Markdown-tuki
   - Kuvien lisäys
   - Linkkien tukeminen

3. **Moderointityökalut**
   - Spam-suoja
   - Sisällön moderointi
   - Raportointitoiminnot
   - Anonyymien kommenttien moderointi

4. **Hakutoiminnot**
   - Kommenttien haku
   - Suodattimet
   - Järjestelyvaihtoehdot

5. **Ilmoitukset**
   - Email-notifications
   - Push-notifications
   - In-app notifications

### 🛠️ Tekniset parannukset

1. **Tietokanta-integraatio**
   - Oikea tietokantarakenne
   - Indeksit suorituskyvyn parantamiseksi
   - Backup-strategiat

2. **Caching**
   - Redis-cache kommenteille
   - CDN-optimointi

3. **Analytics**
   - Kommenttien analytics
   - Käyttäjien aktiviteetti
   - Suorituskyvymittaukset

## Kehitysympäristö

### Asennus
```bash
npm install
npm run dev
```

### Testaus
```bash
# API-testaus
curl -X GET "http://localhost:3000/api/comments?courseId=test"

# Kommentin lisäys (kirjautuneena)
curl -X POST "http://localhost:3000/api/comments" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"test","content":"Testikommentti"}'
```

### Debugging
- Console.log-viestit komponenteissa
- Network-tab selaimessa API-kutsuille
- React DevTools komponenttien tarkistukseen

## Yhteensopivuus

- **Selaimet**: Chrome, Firefox, Safari, Edge
- **Mobiili**: iOS Safari, Chrome Mobile
- **Versiot**: Modernit selaimet (ES6+)

## Ongelmanratkaisu

### Yleisiä ongelmia

1. **Kommentit eivät lataudu**
   - Tarkista kirjautumistila
   - Tarkista network-tab virheille
   - Tarkista console virheille

2. **Kommentin lisäys ei toimi**
   - Tarkista että olet kirjautunut
   - Tarkista tekstikentän sisältö
   - Tarkista network-tab

3. **UI-ongelmat**
   - Tarkista HeroUI-asennus
   - Tarkista Tailwind CSS
   - Puhdista cache

4. **Avatar-ongelmat**
   - Tarkista avatar-generaattori
   - Tarkista SVG-tuki selaimessa
   - Tarkista email/ID-tiedot

### Debug-ohjeet

```javascript
// Console.log kommenttien lataamiseen
console.log("CommentSection loaded for course:", courseId);

// API-kutsun testaus
fetch("/api/comments?courseId=test")
  .then(res => res.json())
  .then(data => console.log(data));

// Avatar-generaattorin testaus
import { generateAvatarDataURL } from "@/lib/avatarGenerator";
console.log(generateAvatarDataURL("test@example.com", "user123"));
```

## Lisenssi

MIT License - katso LICENSE-tiedosto lisätietoja varten.
