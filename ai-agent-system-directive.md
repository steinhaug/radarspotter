# AI AGENT SYSTEM DIRECTIVE

## PROSJEKT OVERSIKT
Proprietary PHP project using modern tooling and strict development guidelines. Every decision must align with established patterns and documented procedures.

## STYLING SYSTEM - TAILWIND + CUSTOM SCSS
Core principle: Tailwind CSS as foundation with custom extensions.

Adding custom styles process:
1. Create .scss file in /tailwind/custom-styles/ with descriptive name
2. Start file with detailed comment block explaining purpose and usage
3. Write CSS code - no limitations on complexity
4. Run npm run ai-agent-rebuild to auto-generate imports and build

Never add inline styles without justification, modify core Tailwind files directly, or skip the build process.

## TEMPLATE SYSTEM - TWIG
Template location: /templates/twig/ directory

Each directory contains .meta.json file documenting ALL templates in that folder.
For AI guidance refer to /docs-ai/how-to-render-twig-templates.md

Meta files contain usage instructions, required/optional parameters, code examples, data types and default values.

## FILER OG MAPPER - EKSKLUDERINGER
Never analyze or modify unless explicitly requested:
- /docs/**/* - Human documentation
- /logs/**/* - Webserver logs
- /node_modules/**/* - Dependencies
- /vendor/**/* - Composer dependencies
- /templates/cache/**/* - Twig cache
- /public_html/playground/**/* - Testing area outside main app

Requires specific styling context:
- /tailwind/**/* - Only when creating custom styles

## DOKUMENTASJON OG AI KONTEKST

### /docs-ai - AI DOKUMENTASJON
Token-optimized documentation written for AI consumption. Project files reference these for implementation guidance.

### /ai-prompts - PROMPT TEMPLATES
Prompt templates for different scenarios. Not intended for AI-agents to index.

### DOT FILER - AI KONTEKST

.meta.json  
- Indexed meta-information covering files in directory. Use instead of parsing all files.  

.instructions.md  
- Contextual instructions for how to use files in folder.  

### LOGGING FILER

.audit.log  
- Human readable history of changes. AI-Agents will create and update theese files as updates are made.

Whenever a change or update is done in a folder, the AI-Agent must write a log entry to this file using the following logic:
- If the file does not exist, create it
- Write entry using the following format "YYYY-MM-DD HH:MM - Brief description of change" and append the log file.

## KODEGENERERING - MINIMALISTISK TILNÆRMING
Løs BARE det som eksplisitt blir spurt om.

Strict guidelines:
- Ikke legg til "nyttige" tilleggsfunksjoner uten forespørsel
- Hver kodelinje må ha klar, spesifikk grunn til å eksistere
- Spør deg selv: "Ba brukeren om dette?" før du legger til noe
- Foretrekk enkle løsninger fremfor omfattende/imponerende løsninger
- Unngå "defensive" koding som sjekker ting brukeren ikke nevnte

Unngå "tre-eksempel fella":
- Ett eksempel er nok hvis det svarer på spørsmålet
- Ikke lag progresjon (basis→praktisk→avansert) uten forespørsel
- Ikke vis "alternative måter" med mindre eksplisitt spurt

## TEKNISKE BEGRENSNINGER

### DEPENDENCIES OG LICENSING
License type: Proprietary - ALL dependencies must be MIT/Apache/BSD compatible.
Never add GPL/LGPL libraries.
Validation: Refer to /docs-ai/lisensoverholdelse-kontinuerlige-krav.md

### FILSTRUKTUR
- /public_html/ - Web accessible files only
- /src/ - Business logic
- /templates/ - Twig templates with metadata
- /tailwind/ - Custom styles with required documentation

### CREDENTIALS MANAGEMENT
Never modify .credentials.php (template file).
Local changes go to credentials.php (not in Git).

## BESLUTNINGSPRIORITERINGER
1. Documentation first: Check existing docs before proposing solutions
2. Minimal scope: Solve exactly what's asked, nothing more
3. Pattern consistency: Follow established project patterns
4. Build requirements: Remember compilation steps for templates/styles
5. License compliance: Verify all additions are proprietary-compatible

## FEILFOREBYGGELSE
Before suggesting ANY change:
- Is this explicitly requested?
- Does this follow documented patterns?
- Will this require additional build steps?
- Is this the minimal solution?
- Have I checked project constraints in /docs-ai?

## META-FILE SYSTEM
Special considerations when working with source files in /tailwind/ and /templates/ directories.
Both have special maintenance logic when changes are done.
Check .instructions.md in each folder for specific instructions.

Your job is to work within these constraints, not to redesign them. When in doubt, ask for clarification rather than assuming.