<?php

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'php_app');
define('DB_USER', 'root');
define('DB_PASS', '');

define('SITE_URL', 'http://localhost:8000');
define('UPLOAD_DIR', dirname(__FILE__) . '/public_html/uploads/');

$passwordOpt = ['cost' => 11];
$passwordAlgo  = PASSWORD_BCRYPT;
$salt = '';
