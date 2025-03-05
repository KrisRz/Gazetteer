<?php

ini_set('display_errors', 'Off');  // Disable error display
error_reporting(0);  // Disable all error reporting


$executionStartTime = microtime(true);

// Validate input parameters
if (!isset($_POST['north'], $_POST['south'], $_POST['east'], $_POST['west'])) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "error";
    $output['status']['description'] = "Missing required parameters";
    echo json_encode($output);
    exit;
}


$username = "szyszka518";

// API URL
$url = "http://api.geonames.org/citiesJSON?"
    . "north=" . urlencode($_POST['north'])
    . "&south=" . urlencode($_POST['south'])
    . "&east=" . urlencode($_POST['east'])
    . "&west=" . urlencode($_POST['west'])
    . "&maxRows=300"
    . "&username=$username";

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Check if API call was successful
if ($httpCode !== 200 || !$result) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "error";
    $output['status']['description'] = "Failed to fetch data from GeoNames API";
    echo json_encode($output);
    exit;
}

// Decode API response
$decode = json_decode($result, true);

// Ensure the response is valid
if (!isset($decode['geonames'])) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "error";
    $output['status']['description'] = "Invalid response format from GeoNames API";
    echo json_encode($output);
    exit;
}

// Return successful response
$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $decode;

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
