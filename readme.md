# PHP Prosjektmal for AI-generering av Kode

Dette prosjektet er designet som en standardisert mal for PHP-utvikling med fokus på optimal AI-assistert kodegenerering. Målet er å skape et rammeverk hvor AI-agenter kan produsere konsistent, korrekt og vedlikeholdbar kode.

## Filosofi

AI-generert kode er bare så god som konteksten den får. Dette prosjektet implementerer strukturer og dokumentasjonsmetoder som sikrer at AI-agenter har tilgang til all nødvendig informasjon for å generere produktionsklar kode.

## Teknologistack

- **PHP** - Primær backend-teknologi
- **Composer** - Avhengighetshåndtering
- **Tailwind CSS v4** - Styling med innebygd dark mode
- **Twig** - Template engine
- **Node.js** - For frontend-verktøy (Tailwind kompilering)

## AI-optimaliserte Teknikker

### 1. Strukturert Dokumentasjon
- **Meta-filer**: `.meta.json` i alle template-mapper dokumenterer komponentparametere
- **AI-guider**: Spesialiserte `.md` filer for AI-agent instruksjoner
- **Konsistent navngivning**: Forutsigbare mønstre for mapper og filer

### 2. Intelligent Docblock-strategier
```php
/**
 * @ai-meta .meta.json files in template directories for component parameters
 * @ai-guide /docs-ai/how-to-render-twig-templates.md Usage patterns and syntax
 */
```
AI-spesifikke tags i docblocks som peker mot relevant kontekst uten å forurense standard dokumentasjon.

### 3. Kontekst-rikt Template System
- **Twig-komponenter** med full parameterdokumentasjon
- **Elegant rendering-syntax**: `twig('@components/card.twig', $data)`
- **Automatisk path-resolving** og feilhåndtering

### 4. Progresiv Kompleksitet
Systemet støtter både enkle og avanserte brukstilfeller uten å komplisere grunnleggende operasjoner.

### 5. Vedlikeholdsstrategi
- **Dokumentert oppdateringsprosess** for å holde meta-informasjon synkronisert
- **Fremtidsrettet** for automatisering av dokumentasjonsgenerering

## Mappestruktur

```
/
├── templates/twig/          # Twig templates med AI-dokumentasjon
│   ├── components/          # Gjenbrukbare UI-komponenter
│   ├── base/               # Layout templates
│   ├── partials/           # Header, footer, etc.
│   └── _ai_guide.md        # AI-instruksjoner for template-bruk
├── tailwind/               # Tailwind source files
├── public_html/            # Web root
├── docs/                   # Prosjektdokumentasjon
└── node_modules/           # Frontend dependencies
```

## AI-vennlige Funksjoner

### Template Rendering
```php
// Enkel, konsistent syntax
echo twig('@components/button.twig', [
    'text' => 'Click me',
    'type' => 'primary'
]);
```

### Dark Mode Support
Automatisk dark mode i alle komponenter uten ekstra konfigurasjon.

### Dokumenterte Parametere
Alle komponenter har dokumenterte parametere i tilhørende `.meta.json` filer.

## Beste Praksis for AI-assistert Utvikling

### For AI-agenter som arbeider med dette prosjektet:

1. **Les meta-filer først** - Sjekk `.meta.json` før du foreslår komponentbruk
2. **Følg etablerte mønstre** - Bruk eksisterende konvensjoner for konsistens
3. **Oppdater dokumentasjon** - Ved endringer, oppdater tilhørende meta-filer
4. **Test komponentparametere** - Verifiser at alle obligatoriske parametere er inkludert

### Kommunikasjonsmodus-erkjennelse
Dette prosjektet er designet for utviklere som kommuniserer gjennom naturlig samtale fremfor strukturerte lister. AI-agenter bør være oppmerksomne på:
- **Diskusjonsmodus**: Utforsking av alternativer og idéutveksling
- **Kodemodus**: Spesifikke tekniske krav og implementasjonsdetaljer

Overgangssignaler til kodemodus inkluderer tekniske constraints, feilmeldinger, eller spesifikke implementasjonskrav.

## Komme i Gang

1. **Klon prosjektet**
2. **Installer avhengigheter**: `composer install && npm install`
3. **Kompiler CSS**: `npm run build`
4. **Les hensyn som gjelder for prosjektet** i `/docs`
5. **Utforsk komponentene** via `.meta.json` filer


## Installation

### Prerequisites

Before you can run this project, ensure you have the following installed:

- **Composer** (PHP dependency manager)
- **Node.js & npm** (JavaScript dependency manager) 
- **Web server** capable of serving PHP 8.2+ files (Apache, Nginx, or built-in PHP server)

### Quick Setup

1. **Clone the repository** and navigate to the project directory in your terminal

2. **Install dependencies:**
   ```bash
   composer install
   npm install
   ```

3. **Configure credentials:**
   - Copy `_credentials.php` to `credentials.php` in the project root
   - Update `credentials.php` with your actual database/API credentials
   - **Important**: Never commit `credentials.php` to Git (it's in .gitignore)

4. **Set up web server** to serve files from the `public_html/` directory

5. **Access your application** through your web server

### Development Workflow

#### Before Making Changes

**Read the documentation first!** Check the `/docs` folder for project-specific guidelines and requirements that must be maintained at all times.

#### Working with Templates & Styles

Changes to certain directories require additional build processes:

- **Templates** (`/templates/`): Follow Twig templating guidelines in project docs
- **Styles** (`/tailwind/`): Requires CSS compilation - see styling guidelines below

#### Custom Styling

When adding custom CSS styles:

1. Create .scss file in /tailwind/custom-styles/ with descriptive name
2. Start file with detailed comment block explaining purpose and usage
3. Write CSS code - no limitations on complexity
4. Run npm run ai-agent-rebuild to auto-generate imports and build

### Maintaining Credentials

- **Active file**: `credentials.php` (not in Git)
- **Template file**: `_credentials.php` (tracked in Git)
- **Rule**: Any changes to `credentials.php` must also be reflected in `_credentials.php` template
- The template file should always represent 100% of the structure/values used in the system

### Build Commands

- `composer install` - Install/update PHP dependencies   
- `npm install` - Install/update Node.js dependencies  

- `npm run build` - Compile Tailwind CSS for production  
- `watch` - Re-build with watch adedde for auto-rebuilds  
- `ai-agent-rebuild` - AI Agent re-build command  
- `rebuild` - Human re-build command  

### Project Structure

```
/docs              # Project documentation and guidelines
/logs              # Apache logs
/node_modules      # Node.js dependencies
/public_html       # Public web files (document root)
/src               # Custom business logic
/tailwind          # Custom styles and Tailwind config
/templates         # Twig templates with metadata
/vendor            # Composer dependencies
credentials.php    # Local credentials (not in Git)
_credentials.php   # Credential template (in Git)
```

---

**Mål**: Skape et miljø hvor AI kan generere produktionsklar PHP-kode med minimal menneskelig intervensjon, samtidig som koden forblir vedlikeholdbar og utvidbar.

## Credits

kim at steinhaug dot com

