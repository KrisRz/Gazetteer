<?php

ini_set('display_errors', 'Off');  // Disable error display
error_reporting(0);  // Disable all error reporting


	$executionStartTime = microtime(true);

	$countryCode = isset($_POST['country']) ? $_POST['country'] : (isset($_GET['country']) ? $_GET['country'] : null);

if (!$countryCode) {
    echo json_encode(["status" => ["code" => "400", "name" => "error", "description" => "Missing country parameter"]]);
    exit;
}

$url = 'https://restcountries.com/v3.1/alpha/' . $countryCode . '?fields=flags,region,capital,languages,population,area';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $decode;
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
