<?php

ini_set('display_errors', 'Off');  // Hide errors from users
ini_set('log_errors', 'Off');  // Enable error logging
error_reporting(0);  // Disable all error reporting


$executionStartTime = microtime(true);


$url = 'http://api.geonames.org/wikipediaSearchJSON?q=' . $_POST['country'] . '&username=szyszka518&maxRows=60';



$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

curl_close($ch);

$decode = json_decode($result, true);

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
