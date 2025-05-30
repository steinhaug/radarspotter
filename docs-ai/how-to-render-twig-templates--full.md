# TWIG Rendering System - Complete AI Guide

The [AI Guide - Condensed](how-to-render-twig-templates.md) is located here.  

## Overview
This system uses a custom `twig()` function for elegant template rendering with automatic path resolution and parameter validation.

## Core Syntax
```php
echo twig('@template-path.twig', $parameters_array);
```

### Path Resolution Rules
1. **@ Prefix**: Always required, acts as root substitute
2. **Directory Structure**: `@directory/file.twig` maps to `/templates/twig/directory/file.twig`
3. **Root Level**: `@file.twig` maps to `/templates/twig/file.twig`
4. **Auto Extension**: `.twig` automatically added if missing

### Examples of Path Resolution
```php
// These are equivalent:
echo twig('@components/card.twig', $data);
echo twig('@components/card', $data);

// Root level template
echo twig('@layout.twig', $data);
echo twig('@layout', $data);
```

## Parameter System
All components are documented in `/templates/twig/components/_meta.json` with:
- **Required parameters**: Must be provided or template may fail
- **Optional parameters**: Enhance functionality, have sensible defaults
- **Parameter types**: String, boolean, array specifications
- **Default values**: What happens when parameter is omitted

### Parameter Best Practices
```php
// Minimal usage (only required params)
echo twig('@components/modal.twig', [
    'id' => 'confirm-modal'  // Required
]);

// Enhanced usage (required + optional)
echo twig('@components/modal.twig', [
    'id' => 'confirm-modal',      // Required
    'title' => 'Confirm Action',  // Optional
    'size' => 'lg',              // Optional
    'content' => '<p>Are you sure?</p>'  // Optional
]);
```

## Component Categories

### Layout Components (`@base/`)
Base templates and main layouts:
```php
echo twig('@base/layout.twig', [
    'title' => 'Page Title',
    'content' => $page_content
]);
```

### Reusable Parts (`@partials/`)
Header, footer, sidebar elements:
```php
echo twig('@partials/header.twig', [
    'user' => $current_user,
    'navigation' => $menu_items
]);
```

### UI Components (`@components/`)
Buttons, cards, modals, alerts:
```php
echo twig('@components/button.twig', [
    'text' => 'Save Changes',
    'type' => 'primary',
    'size' => 'lg'
]);
```

### Forms (`@forms/`)
Form elements and complete forms:
```php
echo twig('@forms/contact.twig', [
    'action' => '/contact/submit',
    'method' => 'POST'
]);
```

## Advanced Usage Patterns

### Conditional Rendering
```php
if ($user->isLoggedIn()) {
    echo twig('@components/user-menu.twig', ['user' => $user]);
} else {
    echo twig('@components/login-button.twig');
}
```

### Loop Rendering
```php
foreach ($products as $product) {
    echo twig('@components/product-card.twig', [
        'product' => $product,
        'show_price' => true
    ]);
}
```

### Nested Components
```php
$modal_content = twig('@components/alert.twig', [
    'type' => 'warning',
    'message' => 'This action cannot be undone'
]);

echo twig('@components/modal.twig', [
    'id' => 'warning-modal',
    'title' => 'Warning',
    'content' => $modal_content
]);
```

## Error Handling
The system throws exceptions for:
- Missing template files
- Invalid paths
- Required parameters not provided

Always wrap in try-catch for production:
```php
try {
    echo twig('@components/card.twig', $data);
} catch (Exception $e) {
    error_log("Twig error: " . $e->getMessage());
    // Show fallback content
}
```

## Performance Notes
- Templates are cached automatically via Twig's built-in cache
- Cache files stored in `/templates/cache/twig_compilation_cache/`
- Auto-reload enabled i