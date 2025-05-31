<?php

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

define('DB_HOST', 'localhost');
define('DB_PORT', "3306");
define('DB_NAME', 'php_app');
define('DB_USER', 'root');
define('DB_PASS', '');

define('SITE_URL', 'http://localhost:8000');
define('UPLOAD_DIR', dirname(__FILE__) . '/public_html/uploads/');

$passwordOpt = ['cost' => 11];
$passwordAlgo  = PASSWORD_BCRYPT;
$salt = '';

// MySQLi Setup
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$mysqli = Mysqli2::getInstance(DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME);
mysqli_set_charset($mysqli, "utf8");
if ($mysqli->connect_errno) {
		echo 'Failed to connect to MySQL: (' . $mysqli->connect_errno . ') ' . $mysqli->connect_error;
		exit();
}
if( $mysqli->character_set_name() != 'utf8' ){
		if (!$mysqli->set_charset("utf8")) {
				printf("Error loading character set utf8: %s\n", $mysqli->error);
				exit();
		}
}
