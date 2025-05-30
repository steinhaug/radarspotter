# Lisensoverholdelse - Kontinuerlige Krav

**Kritisk dokumentasjon for å opprettholde proprietær lisensstatus**

## Grunnprinsipp

For at dette prosjektet skal forbli proprietært, må ALLE eksterne biblioteker være kompatible med proprietær lisensering. Dette krever kontinuerlig overvåking og validering.

## Tillatte Lisenser for Dependencies

✅ **GODKJENTE lisenser som tillater proprietær bruk:**
- MIT License
- Apache License 2.0
- BSD 2-Clause License
- BSD 3-Clause License
- ISC License

❌ **FORBUDTE lisenser som krever åpen kildekode:**
- GPL (alle versjoner)
- LGPL (alle versjoner) 
- AGPL (alle versjoner)
- MPL (Mozilla Public License)
- CDDL (Common Development and Distribution License)
- EPL (Eclipse Public License)

## Rutiner som MÅ følges

### Ved hver ny dependency:

1. **Sjekk lisensen FØRST** før installasjon:
   ```bash
   composer show [pakkenavn] --all | grep -i license
   ```

2. **Dokumenter beslutningen** i denne filen under "Godkjente Pakker"

3. **Avvis umiddelbart** enhver pakke med copyleft-lisens

### Månedlig kontroll:

1. **Audit alle dependencies:**
   ```bash
   composer licenses
   ```

2. **Verifiser at ingen nye problematiske lisenser er introdusert**

3. **Oppdater denne dokumentasjonen ved endringer**

## Nåværende Status

### Godkjente Pakker (per 28. mai 2025):

| Pakke | Lisens | Godkjent Dato | Notater |
|-------|---------|---------------|---------|
| intervention/image | MIT | 28.05.2025 | Bildebehandling |
| erusev/parsedown | MIT | 28.05.2025 | Markdown parser |
| erusev/parsedown-extra | MIT | 28.05.2025 | Markdown extra |
| matthiasmullie/minify | MIT | 28.05.2025 | CSS/JS minifier |
| wearejust/kirby-twig | MIT | 28.05.2025 | Twig templates |

### Avviste Pakker:
*Ingen per nå - hold denne listen oppdatert*

## Juridiske Konsekvenser

**ADVARSEL**: Inkludering av GPL/LGPL/AGPL-kode vil automatisk:
- Kreve at hele prosjektet blir open source
- Ugyldiggjøre vår proprietære lisens
- Potensielt skape juridisk ansvar

## Nødprosedyrer

**Hvis GPL-kode oppdages:**
1. ⛔ STOPP all distribusjon umiddelbart
2. 🔍 Identifiser omfanget av kontaminering
3. 🗑️ Fjern problematisk kode fullstendig
4. ⚖️ Vurder juridisk rådgivning ved behov
5. ✅ Verifiser ren tilstand før gjenopptagelse

## Ansvarlig Person

**Prosjektleder**: [Ditt navn]  
**Sist oppdatert**: 28. mai 2025  
**Neste review**: Juni 2025

---

**HUSK**: Denne dokumentasjonen må oppdateres ved HVER endring i dependencies. Ignorering av disse kravene kan ødelegge hele lisensstrategien.