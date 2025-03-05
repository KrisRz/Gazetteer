<?php

ini_set('display_errors', 'Off');  // Disable error display
error_reporting(0);  // Disable all error reporting


header('Content-Type: application/json; charset=UTF-8');

$executionStartTime = microtime(true);

// Validate incoming POST data
if (!isset($_POST['lonMin'], $_POST['latMin'], $_POST['lonMax'], $_POST['latMax'])) {
    echo json_encode([
        "status" => [
            "code" => "400",
            "name" => "error",
            "description" => "Missing required parameters: lonMin, latMin, lonMax, latMax"
        ],
        "data" => null
    ]);
    exit;
}

// Sanitize and convert input values
$lonMin = floatval($_POST['lonMin']);
$latMin = floatval($_POST['latMin']);
$lonMax = floatval($_POST['lonMax']);
$latMax = floatval($_POST['latMax']);

// Log received values (for debugging)
file_put_contents("debug_log.txt", "Fuel API Request - lonMin: $lonMin, latMin: $latMin, lonMax: $lonMax, latMax: $latMax\n", FILE_APPEND);

// OpenTripMap API request URL
$apiKey = "5ae2e3f221c38a28845f05b68a60ac551050a1a74c38664bcc897210";
$url = "https://api.opentripmap.com/0.1/en/places/bbox?lon_min=$lonMin&lat_min=$latMin&lon_max=$lonMax&lat_max=$latMax&kinds=fuel&limit=30&format=geojson&apikey=$apiKey";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

// Check for cURL errors
if ($result === false) {
    echo json_encode([
        "status" => [
            "code" => "500",
            "name" => "error",
            "description" => "cURL error: " . curl_error($ch)
        ],
        "data" => null
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Decode JSON response
$decode = json_decode($result, true);

// Check if API response is valid
if (!isset($decode['features'])) {
    echo json_encode([
        "status" => [
            "code" => "500",
            "name" => "error",
            "description" => "Invalid API response or no fuel stations found."
        ],
        "data" => $decode
    ]);
    exit;
}

// Prepare final output
$output = [
    "status" => [
        "code" => "200",
        "name" => "ok",
        "description" => "success",
        "returnedIn" => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    "data" => $decode
];

// Send JSON response
echo json_encode($output, JSON_PRETTY_PRINT);
