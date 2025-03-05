<?php
ini_set('display_errors', 'Off');  // Disable error display
error_reporting(0);  // Disable all error reporting


$executionStartTime = microtime(true);

// Check if latitude and longitude are provided
if (!isset($_POST['lat']) || !isset($_POST['lng'])) {
    echo json_encode(["status" => "error", "message" => "Missing latitude or longitude."]);
    exit;
}

$latitude = $_POST['lat'];
$longitude = $_POST['lng'];

// BigDataCloud Time Zone API
$apiKey = "bdc_b1686dad11d04126ae8208b5780858d6"; 
$url = "https://api.bigdatacloud.net/data/timezone-by-location?latitude=$latitude&longitude=$longitude&key=$apiKey";

// Fetch data from API
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);
$apiResponse = curl_exec($ch);
curl_close($ch);

// Convert JSON response to array
$data = json_decode($apiResponse, true);

$output = [
    "status" => [
        "code" => "200",
        "name" => "ok",
        "description" => "success",
        "returnedIn" => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    "data" => $data
];

// Send JSON response
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
