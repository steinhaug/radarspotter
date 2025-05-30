# TWIG Rendering System - AI Guide (Condensed)

The [AI Guide - Full](how-to-render-twig-templates--full.md) is located here.  

## Syntax
```php
echo twig('@path/template.twig', ['param' => 'value']);
```

## Path Rulesv
- `@` prefix required
- `@components/card.twig` → `/templates/twig/components/card.twig`
- `@layout.twig` → `/templates/twig/layout.twig` (root level)
- Extension `.twig` auto-added if missing

## Component Parameters
Check `/templates/twig/components/_meta.json` for:
- Required parameters (must include)
- Optional parameters (include as needed)
- Parameter types and default values

## Quick Examples
```php
// Basic card
echo twig('@components/card.twig', [
    'title' => 'Hello World',
    'content' => '<p>Lorem ipsum</p>'
]);

// Button with styling
echo twig('@components/button.twig', [
    'text' => 'Click me',
    'type' => 'primary',
    'size' => 'lg'
]);

// Root template
echo twig('@layout.twig', ['title' => 'Page Title']);
```

## Workflow
1. Check `_meta.json` for component parameters
2. Use `twig()` function with `@` path syntax
3. Pass required parameters + optional as needed
4. All components support dark mode automatically