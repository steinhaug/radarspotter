<?php

require_once __DIR__ . '/credentials.php';
require_once __DIR__ . '/vendor/autoload.php';

define( 'APPDATA', __DIR__ . '/appdata/' );

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('UTC');


/* Render a TWIG template
$twig_template = '/components/card.html';
$loader = new \Twig\Loader\FilesystemLoader(ABSPATH . 'templates/twig');
$twig = new \Twig\Environment($loader, [ 'debug' => true, 'cache' => ABSPATH . 'templates/cache/twig_compilation_cache', 'auto_reload' => true, 'strict_variables' => false, 'optimizations' => 1 ]);
echo $twig->render($twig_template . '.twig', [
    'title' => 'Hello world',
    'content' => '<p>Lorem ispum</p>'
]);
*/

// Global Twig setup
$GLOBALS['twig_loader'] = new \Twig\Loader\FilesystemLoader(ABSPATH . 'templates/twig');
$GLOBALS['twig_env'] = new \Twig\Environment($GLOBALS['twig_loader'], [
    'debug' => true,
    'cache' => ABSPATH . 'templates/cache/twig_compilation_cache',
    'auto_reload' => true,
    'strict_variables' => false,
    'optimizations' => 1
]);

/**
 * Render Twig template with elegant syntax
 * 
 * @param string $template - Template path with @ prefix (@components/card.twig or @some-file.twig)
 * @param array $data - Data to pass to template
 * @return string - Rendered HTML
 * 
 * @ai-meta Look for .meta.json files in template directories for component usage
 * @ai-guide /docs-ai/how-to-render-twig-templates.md Usage patterns and syntax
 */
function twig($template, $data = []) {
    // Remove @ prefix
    $template = ltrim($template, '@');
    
    // If no directory specified, look in root
    if (strpos($template, '/') === false) {
        $template_path = $template;
    } else {
        $template_path = $template;
    }
    
    // Ensure .twig extension
    if (!str_ends_with($template_path, '.twig')) {
        $template_path .= '.twig';
    }
    
    try {
        return $GLOBALS['twig_env']->render($template_path, $data);
    } catch (\Twig\Error\LoaderError $e) {
        throw new Exception("Twig template not found: {$template_path}");
    }
}

