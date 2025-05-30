# Vedlikehold av Twig-filer

Ved opprettelse eller redigering av Twig-filer må flere meta-filer oppdateres for at AI-agenter skal kunne arbeide effektivt med systemet.

## Bakgrunn

For å skape et arbeidsmiljø hvor AI-agenter kan operere ressurseffektivt og samtidig produsere korrekte resultater, kreves vedlikehold av spesialiserte meta-filer som dokumenterer tilgjengelige komponenter og deres bruk.

## _meta.json - Komponent-dokumentasjon

Hver mappe under `/templates/twig/` skal inneholde en `_meta.json` fil som dokumenterer:

- **Tilgjengelige parametere** for hver Twig-template
- **Obligatoriske vs. valgfrie** feltinnstillinger  
- **Datatyper og standardverdier** for alle parametere
- **Brukseksempler** for AI-agenter

### Formål
AI-agenter kan raskt identifisere hvilke komponenter som er tilgjengelige og hvordan de skal brukes, uten å måtte analysere Twig-koden selv.

### Format
JSON-struktur som dokumenterer alle nødvendige felter for 100% funksjonalitet. Formatet er under kontinuerlig utvikling basert på erfaringer fra AI-agent bruk.

## _ai_guide.md - Integrasjonsinstrukser

Inneholder standardiserte instrukser for hvordan AI-agenter skal:
- Rendre Twig-filer korrekt
- Bruke `twig()`-funksjonen med riktig syntax
- Håndtere parametere og feilsituasjoner

### Formål
Sikre at AI-agenter skriver korrekt integrasjonskode ved bruk av Twig-systemet.

## Oppdateringsprosess

**Ved endring av eksisterende Twig-template:**
1. Oppdater template-filen
2. Verifiser at `_meta.json` reflekterer alle endringer i parametere
3. Test at eksempelkode i `_meta.json` fortsatt fungerer

**Ved opprettelse av ny Twig-template:**
1. Opprett template-filen
2. Legg til komplett dokumentasjon i `_meta.json`
3. Inkluder arbeidseksempel i dokumentasjonen

## Fremtidig automatisering

Målet er å automatisere generering av `_meta.json` basert på docblocks i Twig-filer for å redusere manuelt vedlikeholdsarbeid.

---

**Versjon:** 1.0  
**Sist oppdatert:** 28 mai, 2025