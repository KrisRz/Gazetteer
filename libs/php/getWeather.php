<?php

ini_set('display_errors', 'Off');  // Disable error display
error_reporting(0);  // Disable all error reporting


$executionStartTime = microtime(true);

$city = isset($_POST['citysearch']) ? $_POST['citysearch'] : 'London';
$country = isset($_POST['countrycode']) ? $_POST['countrycode'] : 'GB';

$url = "https://api.openweathermap.org/data/2.5/weather?q=$city,$country&units=metric&appid=640572bb0855c9265c4408e3735b841d";

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
?>
