<?php

	$executionStartTime = microtime(true);

	$countryData = json_decode(file_get_contents("../../libs/js/countryBorders.geo.json"), true);

	$country = [];

	foreach ($countryData['features'] as $feature) {

		if ($feature["properties"]['iso_a2'] === $_POST['country']) {

		$temp = null;
		$temp['code'] = $feature["properties"]['iso_a3'];	

		array_push($country, $temp);

		break;
		
		};
	};

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $country;

	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
	
?>