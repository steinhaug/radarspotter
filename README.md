# RadarVarsler

RadarVarsler er et samfunnsdrevet verktøy som lar bilister sammen skape et sikrere trafikklandskap. Appen lar brukere markere plasseringer av fartskontoller og radarer i sanntid på et interaktivt kart, med muligheter for verifisering av rapporter gjennom flere brukere. Dette er ikke bare et verktøy for å unngå fartsbot, men et fellesskap som oppmuntrer til sikrere kjøring gjennom bevisstgjøring.

## Kjernefunksjoner

- Ett-klikk rapportering av fartskontoller på et interaktivt kart
- Automatisk verifisering av rapporter når flere brukere markerer samme sted
- Personalisert dashboard med brukerstatistikk og prestasjoner
- Automatisk utløp av rapporter etter 3 timer for å sikre relevans
- Støtte for flere språk (norsk og engelsk)
- Freemium forretningsmodell med 30 dagers gratis prøveperiode

## Komponenter og arkitektur

### Frontend

Applikasjonen er bygget med en moderne React-arkitektur som legger vekt på ytelse og mobilbruk:

- **Kartvisning (Map.tsx)**: Bygget på Mapbox GL JS for flytende kartopplevelse med tilpassbare markører. Kartet plasseres som hovedvisning med integrert geolokasjon.

- **Rapporteringssystem (ReportButton.tsx)**: Forenklet grensesnitt som lar brukere rapportere en kontroll med et enkelt klikk uten forstyrrende skjemaer.

- **Datavisualisering (BottomSheet.tsx)**: Implementert med Framer Motion for myke overganger når brukere utforsker detaljer om radar-rapporter.

- **Brukerautentisering**: Implementert med en egenutviklet Hook-basert autentiseringsflyt (`useAuth.ts`) som tar vare på brukerens tilstand.

- **Internasjonalisering (i18n.ts)**: Bygget med en tilpasset, lett løsning for flerspråklig støtte som automatisk tilpasser seg brukerens enhetsinnstillinger.

### Backend

- **Express API**: RESTful API-endepunkter for brukerautentisering, rapportering og datainnhenting.

- **Datalag**: Implementert med Drizzle ORM for typesikker databasekommunikasjon, med automatisk skjemavalidering.

- **Sanntidsvalidering**: Algoritme for gruppering og verifisering av radarkontroller basert på geografisk nærhet.

- **Achievements-system**: Gamification-elementer som belønner aktive brukere med badges og statuspoeng.

## Biblioteker og teknologier

**Frontend Core**: React + TypeScript + Tailwind CSS gir en robust og skalerbar arkitektur med eksepsjonell utviklerhastighet og streng typesikkerhet.

**UI Komponenter**: shadcn/ui leverer et elegant, konsistent design med minimale tilpasninger nødvendig.

**Kartløsning**: Mapbox GL JS er svært ytelsesoptimalisert for mobile enheter med støtte for offline-funksjonalitet.

**Datalagring**: PostgreSQL med Drizzle ORM gir typesikker datahåndtering med utmerket utvikleropplevelse.

## Installasjon og oppsett

### Forutsetninger

- Node.js (v16 eller nyere)
- npm (v7 eller nyere)
- PostgreSQL-database (v12 eller nyere)
- Mapbox API-nøkkel

### Trinn for trinn

1. Klon repositoriet:
   ```
   git clone <repository-url>
   cd radarvarsler
   ```

2. Installer avhengigheter:
   ```
   npm install
   ```

3. Konfigurer miljøvariabler ved å opprette en `.env`-fil:
   ```
   DATABASE_URL=postgres://brukernavn:passord@host:port/database
   MAPBOX_API_KEY=din_mapbox_api_nøkkel
   SESSION_SECRET=et_sikkert_tilfeldig_passord
   ```

4. Opprett databasetabeller:
   ```
   npm run db:push
   ```

5. Start utviklingsserveren:
   ```
   npm run dev
   ```

### Systemsjekk

Før du starter applikasjonen, kan du kjøre vår innebygde systemsjekk for å verifisere at alt er riktig konfigurert:

```
npx tsx checkSetup.ts
```

Dette verktøyet vil teste:
1. Databasetilkobling og tilgang
2. Node.js-installasjon og versjon
3. Databasetabeller og testbruker

Hvis du får "Alt klart! Systemet er korrekt konfigurert og klart til bruk", er du klar til å begynne.

### Testbruker

En testkonto opprettes automatisk under systemsjekk:
- Brukernavn: test
- Passord: test

## Bidragsytere

- **Behzad Zafar** - Frontend og kartintegrasjon, UI/UX design
- **Kim Steinhaug** - Systemarkitektur, backend-utvikling, test-scripts