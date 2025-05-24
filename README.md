# Radar Detection Application

En geolokalisert radarvarslingsapp som lar brukere rapportere og se radarkontroller på et interaktivt kart.

## Funksjoner

- Interaktivt Mapbox-kart for visning av aktive radarkontroller
- Rapportering av radarkontroller med ett klikk
- Automatisk verifisering av rapporter
- Brukerautentisering med personlig dashboard
- Prestasjonsbadger og statistikk
- Flerspråkstøtte (norsk og engelsk)
- Freemium-modell (30 dagers gratis prøveperiode)

## Kom i gang

### Forutsetninger

- Node.js (v16 eller nyere)
- npm eller yarn
- PostgreSQL-database

### Installasjon

1. Klon dette prosjektet
2. Installer avhengigheter:
   ```
   npm install
   ```
3. Konfigurer miljøvariabler ved å opprette en `.env`-fil i rotmappen:
   ```
   DATABASE_URL=postgres://brukernavn:passord@host:port/database
   MAPBOX_API_KEY=din_mapbox_api_nøkkel
   ```
4. Start applikasjonen:
   ```
   npm run dev
   ```

## Systemsjekk

Vi har inkludert et verktøy for å sjekke om systemoppsettet ditt er korrekt konfigurert. For å kjøre systemsjekken:

```
npx tsx checkSetup.ts
```

Dette verktøyet vil teste:
1. Databasetilkobling
2. Node.js-installasjon
3. Databasefunksjonalitet
4. Avhengigheter

Hvis alle testene passerer, er systemet ditt klart til bruk. Hvis noen tester mislykkes, vil du få spesifikke feilmeldinger som hjelper deg å løse problemene.

## Testbrukere

For testformål kan du bruke følgende brukerdetaljer:
- Brukernavn: test
- Passord: test

## Teknisk Stack

- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Express, Node.js
- Database: PostgreSQL med Drizzle ORM
- Kart: Mapbox GL JS
- Autentisering: Passport.js