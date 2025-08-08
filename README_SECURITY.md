# Tietoturva - Totuusonrakkaus

Tämä dokumentti kuvaa Totuusonrakkaus-alustan tietoturvaominaisuudet ja -käytännöt.

## Toteutetut Tietoturvaominaisuudet

### 1. Security Headers

Next.js konfiguraatiossa on toteutettu kattavat security headers:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
      ]
    }
  ];
}
```

**Ominaisuudet:**
- **X-Frame-Options**: Estää clickjacking-hyökkäykset
- **X-Content-Type-Options**: Estää MIME-sniffing
- **X-XSS-Protection**: XSS-suoja vanhemmille selaimille
- **HSTS**: Pakottaa HTTPS-yhteydet
- **Permissions-Policy**: Rajoittaa selaimen ominaisuuksia

### 2. Content Security Policy (CSP)

Kattava CSP-politiikka on toteutettu:

```typescript
const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.supabase.co https://*.vimeo.com",
  "frame-src 'self' https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');
```

**Suojatut ominaisuudet:**
- Estää XSS-hyökkäykset
- Rajoittaa resurssien lataamisen sallittuihin domaineihin
- Estää data: ja javascript: URL:t

### 3. Middleware-turvallisuus

Kattava middleware on toteutettu kaikille pyynnöille:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 1. Request validation
  // 2. Rate limiting
  // 3. CORS headers
  // 4. Security headers
  // 5. Admin endpoint protection
  // 6. Attack pattern detection
}
```

**Ominaisuudet:**
- **Rate Limiting**: 100 pyyntöä/minuutti, 20 kirjautumisyritystä/minuutti
- **Request Validation**: Tarkistaa epäilyttävät patternit
- **CORS**: Rajoittaa cross-origin pyynnöt
- **Admin Protection**: Suojaa admin-endpointit

### 4. Input Sanitization

Kattava input sanitization -kirjasto on toteutettu:

```typescript
// src/lib/sanitization.ts
export const sanitizeText = (input: string): string => {
  // Poista HTML-tagit
  // Poista JavaScript-koodi
  // Poista SQL injection patterns
  // Poista command injection patterns
  // Rajoita pituus
};
```

**Suojatut ominaisuudet:**
- HTML-tagien poisto
- JavaScript-koodin poisto
- SQL injection -patternien poisto
- Command injection -patternien poisto
- Pituusrajoitukset

### 5. Autentikaatio ja Session Management

Supabase Auth -pohjainen turvallinen autentikaatio:

```typescript
// JWT-tokenit
- Access Token: Lyhytikäinen (1 tunti)
- Refresh Token: Pitkäikäinen, turvallinen
- HttpOnly evästeet: XSS-suoja
- Automaattinen token uusiminen
```

**Ominaisuudet:**
- JWT-pohjainen autentikaatio
- HttpOnly evästeet
- Automaattinen token uusiminen
- Session timeout -käsittely

### 6. Tietokantaturvallisuus

Row Level Security (RLS) on toteutettu:

```sql
-- Käyttäjät näkevät vain oman profiilinsa
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Adminit näkevät kaikki profiilit
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

**Ominaisuudet:**
- Roolipohjainen pääsynhallinta
- Tietokantatasoiset käyttöoikeudet
- Automaattinen käyttäjän tunnistus

### 7. API-turvallisuus

Kaikki API-endpointit ovat suojattuja:

```typescript
// Input validation
if (!validateInputLength(content, 1, 2000)) {
  return NextResponse.json({ error: "Virheellinen sisältö" }, { status: 400 });
}

// Sanitization
const sanitizedContent = sanitizeText(content);

// Admin authentication
const adminAuth = await checkAdminAuth(request);
if (!adminAuth.isAdmin) {
  return NextResponse.json({ error: "Ei oikeuksia" }, { status: 401 });
}
```

**Ominaisuudet:**
- Input validation
- Input sanitization
- Admin authentication
- Error handling

### 8. Security Monitoring

Tietoturvatapahtumien seuranta:

```typescript
export const logSecurityEvent = (
  event: string, 
  details: Record<string, any>, 
  severity: 'low' | 'medium' | 'high' = 'low'
) => {
  // Log security events
  // Send to monitoring service for high severity events
};
```

**Seurattavat tapahtumat:**
- Epäilyttävät pyynnöt
- Rate limit ylitykset
- Admin access attempts
- API requests

## Tietoturva-arvio

### ✅ Vahvat puolet

1. **Kattavat Security Headers**: Kaikki tärkeimmät security headers on toteutettu
2. **CSP-politiikka**: Estää XSS ja muut hyökkäykset
3. **Rate Limiting**: Estää DDoS ja brute force -hyökkäykset
4. **Input Sanitization**: Estää injection-hyökkäykset
5. **RLS**: Tietokantatasoiset käyttöoikeudet
6. **JWT Auth**: Turvallinen autentikaatio

### 🔧 Parannusmahdollisuudet

1. **Redis Rate Limiting**: Tuotannossa käytä Redis:ää muistin sijaan
2. **Security Monitoring**: Integroi ulkoiseen monitoring-palveluun
3. **Penetration Testing**: Suorita säännöllisiä penetraatiotestejä
4. **Vulnerability Scanning**: Automatisoi haavoittuvuuksien skannaus

## Käyttöohjeet

### Kehitysympäristö

```bash
# Käynnistä kehityspalvelin
npm run dev

# Tarkista security headers
curl -I http://localhost:3000

# Testaa rate limiting
for i in {1..25}; do curl http://localhost:3000/api/auth/login; done
```

### Tuotantoympäristö

1. **Environment Variables**: Varmista että kaikki salaiset avaimet on asetettu
2. **HTTPS**: Pakota HTTPS-yhteydet
3. **Monitoring**: Seuraa security events
4. **Backup**: Säännölliset tietokantavarmuuskopiot

## Tietoturva-ongelmien Raportointi

Jos löydät tietoturvaongelman:

1. **Älä jaa julkisesti**: Älä jaa ongelmaa julkisesti ennen korjausta
2. **Raportoi turvallisesti**: Käytä turvallista kanavaa raportointiin
3. **Anna aikaa**: Anna riittävästi aikaa ongelman korjaamiseen
4. **Yhteistyö**: Ole valmis yhteistyöhön ongelman ratkaisemiseksi

## Yhteystiedot

Tietoturvaongelmista voi raportoida:
- Email: security@totuusonrakkaus.fi
- Sisäinen ticketing-järjestelmä

---

**Huomio**: Tämä dokumentti päivittyy säännöllisesti uusien tietoturvaominaisuuksien lisäämisen myötä.
