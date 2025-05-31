
<?php
require_once '../environment.php'; // Includes credentials and vendor autoloader

// Make sure session is enabled.
session_start();


// - - - - - - - - - - - - - - - - 
// Lets set-up the variables
//
// $page is used as internal pointer for what we are doing
$page = $_GET['page'] ?? 'home';

// Quick boolean variable for authenticated state, but we need to add the authentication layer first.
$_logged_in = false; /* NOT IMPLEMENTED */





/** CONFIGURABLE ARRAY:
 *  App Footer-navigation links.
 *  Add- edit- or remove- lines to change navigation items. 
 *  Icon names are official "Material Design Icons", reference for user: "https://pictogrammers.com/library/mdi/"
 *  
 * Array syntax: title(string), url(string), icon(string) & active(boolean)
 */
$footer_nav_items = [
    ['title'=>'home', 'url'=>'/?page=home', 'icon'=>'newspaper-variant-outline', 'active'=>false],
    ['title'=>'konto', 'url'=>'/?page=konto', 'icon'=>'apps', 'active'=>false],
    ['title'=>'profil', 'url'=>'/?page=profil', 'icon'=>'star-outline', 'active'=>false]
];


// - - - - - - - - - - - - - - - - 
// ::RENDERING HEADER AND TOP OF PAGE
// 
echo twig('@partials/header.twig', [
    'page_title' => 'The page title',
    'header_includes' => [
        ['style' => './dist/css/tailwind.css'], 
        ['style' => 'https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/1.6.0/tailwind.min.css'],
        ['style' => 'https://cdnjs.cloudflare.com/ajax/libs/MaterialDesign-Webfont/5.3.45/css/materialdesignicons.min.css'],
        ['script' => './dist/js/main.js']
    ],
    'raw_head_begin' => '',
    'raw_head_end' => '',
    'raw_body_begin' => '',
]);



// - - - - - - - - - - - - - - - - 
// ::MAIN PART OF PAGE - START
//  - raw html - html - html raw -
// 







if($page == 'home'){
    // Public page - no auth required
    require ABSPATH . '/appdata/Views/home.php';
    
} elseif($page == 'login'){
    // Login and authentication section 
    require ABSPATH . '/appdata/Views/authentication-page.php';

} elseif($page == 'konto'){
    // Auth required
    if(!$_logged_in) { header('Location: ?page=login'); exit; }
    require ABSPATH . '/appdata/Views/konto.php';
    
} elseif($page == 'profil'){
    // Auth required  
    if(!$_logged_in) { header('Location: ?page=login'); exit; }
    require ABSPATH . '/appdata/Views/profil.php';
    
} else {
    // Unknown page handler
    http_response_code(404);
    require ABSPATH . '/appdata/Views/404.php';
}




// 
//  - raw html - html - html raw -
// ::MAIN PART OF PAGE - STOP
// - - - - - - - - - - - - - - - - 




// - - - - - - - - - - - - - - - - 
// ::RENDERING FOOTER AND END OF PAGE
// 
echo twig('@partials/footer.twig', [
    'navitems' => $footer_nav_items,
    'raw_body_end' => '',
]);
