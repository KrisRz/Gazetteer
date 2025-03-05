<?php

	$executionStartTime = microtime(true);

	$countryData = json_decode(file_get_contents("../../libs/js/countryBorders.geo.json"), true);

	$borders = [];

	foreach ($countryData['features'] as $feature) {

		if ($feature["properties"]['iso_a2'] === $_POST['country']) {

		$temp = null;
		$temp['borders'] = $feature;	

		array_push($borders, $temp);

		break;
		
		};
	};

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $borders;

	header('Content-Type: application/json; charset=UTF-8');

    echo json_encode($output);
	
?>