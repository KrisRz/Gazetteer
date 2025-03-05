// 🌍 Global Variables
let map, lyrOSM, lyrSatellite, overlays, layerControl;
let locationBtn, weatherBtn, wikiInfoBtn, timeBtn;
let objOverlays, border, earthquakes, cities, hotels, FuelStations;
let tempFuel = null, tempHotels = null, tempCities = null, tempEarthquakes = null;

// loading div
const loading = $('#loadingDiv').hide(); 

let selectedCountryCode = "GB"; // Default country is GB
let selectedCountry = "United Kingdom"; // Default country name

// 📌 Listen for dropdown selection
document.getElementById("countrySelect").addEventListener("change", function() {
    selectedCountryCode = this.value; // Update selected country code
    selectedCountry = this.options[this.selectedIndex].text; // Update country name
    console.log("Country changed:", selectedCountry, "Code:", selectedCountryCode);
    loadCountryBorders(selectedCountryCode); // Load borders on change
});

// Initialize Map with Multiple Layers
map = L.map('map', {
    zoomControl: true,  // Enable default zoom controls
    minZoom: 2,         // Prevent zooming out too much
    maxZoom: 10,        // Prevent excessive zooming in
    maxBounds: [        // Set world boundaries to avoid map repetition
        [-85, -180],    // Southwest corner
        [85, 180]       // Northeast corner
    ],
    maxBoundsViscosity: 1.0 // Prevents dragging map outside the defined bounds
}).setView([20, 0], 2);





map.on('load', function() {
    console.log("🌍 Map fully loaded!");
    setTimeout(() => loading.hide(), 500); // Delay hiding preloader slightly
});



// Add Leaflet EasyButtons

// Location Button
locationBtn = L.easyButton('<i class="fa fa-location-arrow"></i>', function(btn, map) {
    getLocation();
}).addTo(map);

// Country Info Button
L.easyButton('<i class="fa fa-globe"></i>', function(btn, map) {
    console.log("🌍 Fetching Country Info...");
    getCountryInfo();
}).addTo(map);

// Weather Button
L.easyButton('<i class="fa fa-cloud-sun"></i>', function(btn, map) {
    console.log("🌤 Fetching Weather...");

    // Get the capital city of the selected country
    $.ajax({
        url: 'libs/php/getCountryInfo.php',
        type: 'POST',
        dataType: 'json',
        data: { country: selectedCountryCode },
        success: function(result) {
            if (result.status.name === 'ok' && result.data.capital) {
                let capitalCity = result.data.capital[0]; // Extract capital city
                console.log("Using capital city:", capitalCity);

                // Fetch weather using the capital city
                getWeather(capitalCity, selectedCountryCode);
            } else {
                console.error("Error: No capital city found for", selectedCountryCode);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching country info:", textStatus, errorThrown);
        }
    });
}).addTo(map);

// Wikipedia Info Button
L.easyButton('<i class="fab fa-wikipedia-w"></i>', function(btn, map) {
    console.log("📚 Fetching Wikipedia Info...");
    getWikiInfo();
    $('#wikiModal').modal('show'); 
}).addTo(map);

// Local Time Button
L.easyButton('<i class="fa fa-clock"></i>', function(btn, map) {
    console.log("🕒 Fetching Local Time...");
    getLocalTime();
}).addTo(map);

// Tile Layers
lyrOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);


lyrSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "© Esri, Maxar, Earthstar Geographics"
});


setTimeout(() => {
    if (!map.hasLayer(lyrOSM)) {
        console.warn("⚠️ Map layer not loaded, retrying...");
        lyrOSM.addTo(map);
    }
}, 1500);



/// Overlay Groups
overlays = {
    "Cities": L.layerGroup(),
    "Earthquakes": L.layerGroup(),
    "Hotels": L.layerGroup(),
    "Fuel Stations": L.layerGroup()
};

// Add to layer control ONCE!
layerControl = L.control.layers(
    { "Streets": lyrOSM, "Satellite": lyrSatellite },
    overlays
).addTo(map);

// User Location Handling
map.locate({ setView: true, maxZoom: 13, watch: false });

map.on('locationfound', function(e) {
    console.log("User location found:", e.latlng);
    map.setView(e.latlng, 13);
    L.marker(e.latlng).addTo(map).bindPopup("You are here!").openPopup();

    // Fetch country code from coordinates using reverse geocoding
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${e.latlng.lat}&longitude=${e.latlng.lng}&localityLanguage=en`)
        .then(response => response.json())
        .then(data => {
            let countryCode = data.countryCode;
            console.log("Detected country code:", countryCode);
            if (countryCode) {
                $("#countrySelect").val(countryCode); // Update to #countrySelect
                loadCountryBorders(countryCode);
            } else {
                console.warn("No country code returned from geocode API");
            }
        })
        .catch(error => console.error("Error fetching country code:", error));
});

map.on('locationerror', function() {
    alert("Location access denied or unavailable. Defaulting to world view.");
});

// Country Borders Function
function loadCountryBorders(countryCode) {
    fetch("libs/js/countryBorders.geo.json")
        .then(response => response.json())
        .then(data => {
            var selectedCountry = data.features.find(feature => 
                feature.properties.iso_a2 === countryCode
            );
            if (window.currentCountryLayer) {
                map.removeLayer(window.currentCountryLayer);
            }
            if (selectedCountry) {
                window.currentCountryLayer = L.geoJSON(selectedCountry, {
                    style: {
                        color: "blue",
                        weight: 3,
                        fillOpacity: 0.3
                    }
                }).addTo(map);
                map.fitBounds(window.currentCountryLayer.getBounds());
            } else {
                console.warn("Country not found in GeoJSON:", countryCode);
            }
        })
        .catch(error => console.error("Error loading GeoJSON:", error));
}

// Add Selected Country Markers To Map


function getOverlays() {
    loading.show(); // Show loading indicator

    // Clear old overlays before loading new ones
    overlays["Cities"].clearLayers();
    overlays["Earthquakes"].clearLayers();
    overlays["Hotels"].clearLayers();
    overlays["Fuel Stations"].clearLayers();

    $.ajax({
        url: 'libs/php/getBoundingBox.php',
        type: 'POST',
        dataType: 'json',
        data: { country: selectedCountryCode },
        success: function (result) {
            if (result.status.name === 'ok') {
                let { north, south, east, west } = result.data[0];

                let fetchPromises = [
                    fetchEarthquakes(north, south, east, west),
                    fetchCities(north, south, east, west),
                    fetchHotels(north, south, east, west),
                    fetchFuelStations(north, south, east, west)
                ];

                // Hide loading after all API calls complete
                Promise.allSettled(fetchPromises).then(() => {
                    console.log("✅ Overlays successfully loaded!");
                    loading.hide(); // 🔥 This ensures the loading indicator disappears
                });
            } else {
                console.error("Bounding box API error:", result.status.description);
                loading.hide();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error fetching bounding box:", textStatus, errorThrown);
            loading.hide();
        }
    });
}




// 🌍 Fetch Earthquake Markers
function fetchEarthquakes(north, south, east, west) {
    $.ajax({
        url: 'libs/php/getEarthquakes.php',
        type: 'POST',
        dataType: 'json',
        data: { north, south, east, west },
        success: function (result) {
            if (result.status.name === 'ok') {
                let earthquakeMarkers = result.data.map(eq => {
                    let earthquakeIcon = L.ExtraMarkers.icon({
                        icon: 'fas fa-exclamation-circle',
                        markerColor: 'red',
                        shape: 'square'
                    });

                    return L.marker([eq.lat, eq.lng], { icon: earthquakeIcon })
                        .bindPopup(`<b>Earthquake</b><br>Magnitude: ${eq.magnitude}<br>Depth: ${eq.depth} km`);
                });

                let earthquakeLayer = L.layerGroup(earthquakeMarkers);
                overlays["Earthquakes"].addLayer(earthquakeLayer);
                
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error fetching earthquakes:", textStatus, errorThrown);
        }
    });
}

// 🏙️ Fetch City Markers
function fetchCities(north, south, east, west) {
    $.ajax({
        url: 'libs/php/getCities.php',
        type: 'POST',
        dataType: 'json',
        data: { north, south, east, west },
        success: function (result) {
            if (result.status.name === 'ok') {
                let cityMarkers = result.data.geonames.map(city => {
                    let cityIcon = L.ExtraMarkers.icon({
                        icon: 'fas fa-city',
                        markerColor: 'blue',
                        shape: 'circle'
                    });

                    return L.marker([city.lat, city.lng], { icon: cityIcon })
                        .bindPopup(`<b>${city.name}</b><br>Population: ${city.population || "N/A"}`);
                });

                let cityLayer = L.layerGroup(cityMarkers);
                overlays["Cities"].addLayer(cityLayer);
                
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error("Error fetching cities:", textStatus, errorThrown);
        }
    });
}

// 🏨 Fetch Hotel Markers
function fetchHotels(north, south, east, west) {
    $.ajax({
        url: 'libs/php/getHotels.php',
        type: 'POST',
        dataType: 'json',
        data: {
            lonMin: west, 
            latMin: south, 
            lonMax: east, 
            latMax: north 
        },
        success: function(result) {
            console.log("Hotel API Response:", result);
            loading.hide();

            if (result.status.name === 'ok' && result.data.features) {
                let hotelMarkers = result.data.features.map(hotel => {
                    let hotelIcon = L.ExtraMarkers.icon({
                        icon: 'fas fa-bed',
                        markerColor: 'green',
                        shape: 'square'
                    });

                    return L.marker(
                        [hotel.geometry.coordinates[1], hotel.geometry.coordinates[0]], 
                        { icon: hotelIcon }
                    ).bindPopup(`<b>${hotel.properties.name || "Unknown Hotel"}</b><br>Click for more details.`);
                });

                let hotelLayer = L.layerGroup(hotelMarkers);
                overlays["Hotels"].addLayer(hotelLayer);
                
            } else {
                console.error("Hotel API error:", result.data.error || "Unknown error");
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            loading.hide();
            console.error("Error fetching hotels:", textStatus, errorThrown, jqXHR.responseText);
        }
    });
}


// ⛽ Fetch Fuel Stations
function fetchFuelStations(north, south, east, west) {
    $.ajax({
        url: 'libs/php/getFuel.php',
        type: 'POST',
        dataType: 'json',
        data: {
            lonMin: west,
            latMin: south,
            lonMax: east,
            latMax: north
        },
        success: function(result) {
            console.log("Fuel API Response:", result);
            loading.hide();

            if (result.status.name === 'ok' && result.data.features) {
                let fuelMarkers = result.data.features.map(station => {
                    let fuelIcon = L.ExtraMarkers.icon({
                        icon: 'fas fa-gas-pump',
                        markerColor: 'black',
                        shape: 'square'
                    });

                    return L.marker(
                        [station.geometry.coordinates[1], station.geometry.coordinates[0]], 
                        { icon: fuelIcon }
                    ).bindPopup(`<b>${station.properties.name || "Fuel Station"}</b><br>Click for more details.`);
                });

                let fuelLayer = L.layerGroup(fuelMarkers);
                overlays["Fuel Stations"].addLayer(fuelLayer);
                
            } else {
                console.error("Fuel API error:", result.data.error || "Unknown error");
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            loading.hide();
            console.error("Error fetching fuel stations:", textStatus, errorThrown, jqXHR.responseText);
        }
    });
}



// 📌 Auto-refresh overlays when the country changes
$("#countrySelect").on("change", function () {
    getOverlays();
});


  // API Functions

// Get Country Info
function getCountryInfo() {
    loading.show();// show loading

    let selectedCountry = $("#countrySelect").val();

    if (!selectedCountry) {
        loading.hide();
        $("#countryInfoModalBody").html("<p>Please select a country first!</p>");
        new bootstrap.Modal(document.getElementById('countryInfoModal')).show();
        return;
    }

    $.ajax({
        url: 'libs/php/getCountryInfo.php',
        type: 'POST',
        dataType: 'json',
        data: { country: selectedCountry },
        success: function(result) {
            if (result.status.code === "200") {
                let country = result.data;
                $("#flag").attr("src", country.flags.png);
                $("#txtCapital").html(country.capital[0] || "N/A");
                $("#txtRegion").html(country.region || "N/A");
                $("#txtLanguages").html(Object.values(country.languages).join(", ") || "N/A");
                $("#txtPopulation").html((country.population / 1_000_000).toFixed(1) + " million");
                $("#txtArea").html(country.area.toLocaleString() + " km²");
    
                new bootstrap.Modal(document.getElementById('countryInfoModal')).show();
            } else {
                $("#countryInfoModalBody").html(`<p>Error: ${result.status.description}</p>`);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $("#countryInfoModalBody").html(`<p>Error: ${textStatus}</p>`);
        },
        complete: function() {
            loading.hide(); // ✅ Ensure loading is hidden in all cases
        }
    });
}

// Get weather
function getWeather(city, country) {
    loading.show();
    console.log("Fetching weather for:", city, country);

    $.ajax({
        url: 'libs/php/getWeather.php',
        type: 'POST',
        dataType: 'json',
        data: { citysearch: city, countrycode: country },
        success: function(result) {
            loading.hide();
            if (result.status.code === "200" && result.data) {
                $("#weatherModalBody").html(`
                    <h5>${result.data.name}, ${result.data.sys.country}</h5>
                    <p><strong>Temperature:</strong> ${result.data.main.temp}°C</p>
                    <p><strong>Feels Like:</strong> ${result.data.main.feels_like}°C</p>
                    <p><strong>Humidity:</strong> ${result.data.main.humidity}%</p>
                    <p><strong>Weather:</strong> ${result.data.weather[0].description}</p>
                `);
            } else {
                $("#weatherModalBody").html(`<p>Error fetching weather data.</p>`);
            }

            // Show the modal **after** the data is ready!
            new bootstrap.Modal(document.getElementById('weatherModal')).show();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            loading.hide();
            $("#weatherModalBody").html(`<p>Error: ${textStatus}</p>`);
            
            // Show error modal only if the request fails
            new bootstrap.Modal(document.getElementById('weatherModal')).show();
        }
    });
}

// Wikipedia
function getWikiInfo() {
    loading.show();
    console.log("📚 Fetching Wikipedia Info...");

    let countryName = $('#countrySelect option:selected').text().trim();
    if (!countryName) {
        console.warn("⚠️ No country selected or country name is empty.");
        $('#wikiModalBody').html("<p>Please select a country first.</p>");
        loading.hide();
        return;
    }

    let searchName = encodeURIComponent(countryName);
    console.log("🔍 Search Query:", searchName);

    $.ajax({
        url: 'libs/php/getWikiEntries.php',
        type: 'POST',
        dataType: 'json',
        data: { country: searchName },
        beforeSend: function () {
            console.log("📡 Sending Wikipedia API request...");
        },
        success: function (result) {
            loading.hide();
            console.log("✅ Wikipedia API Response:", result);

            if (result.status.name === 'ok' && result.data?.geonames?.length > 0) {
                let filteredSearch = result.data.geonames.filter(entry =>
                    entry.summary.toLowerCase().includes(countryName.toLowerCase())
                );

                console.log("🔎 Filtered Results:", filteredSearch);

                let wikiContent = filteredSearch.length > 0
                    ? filteredSearch.slice(0, 10).map(entry => `
                        <p style="border-bottom: 1px solid lightgrey; padding-bottom: 1em;">
                            <strong>${entry.title}:</strong> 
                            <span>${entry.summary.length > 240 ? entry.summary.substring(0, 240) + '...' : entry.summary}</span>
                            <a class="wikiLinkLoad" href="https://${entry.wikipediaUrl}" target="_blank">See More</a>
                        </p>
                    `).join('')
                    : `<p>No relevant Wikipedia entries found for ${countryName}.</p>`;

                $('#wikiModalBody').html(wikiContent);
            } else {
                console.warn("⚠️ No Wikipedia data received.");
                $('#wikiModalBody').html(`<p>No Wikipedia entries found or an error occurred. Please try again later.</p>`);
            }

            console.log("📖 Opening Wikipedia modal...");
            $('#wikiModal').modal('show');

        },
        error: function (jqXHR, textStatus, errorThrown) {
            loading.hide();
            console.error("❌ Wikipedia API Error:", textStatus, errorThrown, jqXHR.responseText);
            $('#wikiModalBody').html(`<p>Error fetching Wikipedia data: ${textStatus}</p>`);

            console.log("📖 Opening Wikipedia modal with error message...");
            $('#wikiModal').modal('show');
        },
        complete: function () {
            console.log("📡 Wikipedia API request completed.");
        }
    });
}


// Local time
function getLocalTime() {
    loading.show(); // ⏳ Show loading

    let lat = map.getCenter().lat;
    let lng = map.getCenter().lng;
    console.log("Fetching local time for:", lat, lng);

    $.ajax({
        url: 'libs/php/getLocalTime.php',
        type: 'POST',
        dataType: 'json',
        data: { lat: lat, lng: lng },
        success: function(result) {
            loading.hide();
            console.log("Local Time API Response:", result);

            if (result.status.code === "200") {
                let localTime = new Date(result.data.localTime).toLocaleTimeString();

                $("#timeModalBody").html(`
                    <h5>Local Time</h5>
                    <p><strong>Time Zone:</strong> ${result.data.effectiveTimeZoneFull} (${result.data.effectiveTimeZoneShort})</p>
                    <p><strong>Current Time:</strong> ${localTime}</p>
                    <p><strong>UTC Offset:</strong> ${result.data.utcOffset}</p>
                    <p><strong>Daylight Saving Time:</strong> ${result.data.isDaylightSavingTime ? "Yes" : "No"}</p>
                `);
            } else {
                console.error("Error fetching local time:", result.status.description);
                $("#timeModalBody").html(`<p>Error fetching local time: ${result.status.description}</p>`);
            }

            // Show the modal **only after** data is ready
            new bootstrap.Modal(document.getElementById('timeModal')).show();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            loading.hide();
            console.warn("Local Time API Error:", textStatus, errorThrown);
            $("#timeModalBody").html(`<p>Error fetching local time: ${textStatus}</p>`);

            // Show modal with error message
            new bootstrap.Modal(document.getElementById('timeModal')).show();
        }
    });
}


// Get Location Function
function getLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                console.log("📍 User location:", position.coords.latitude, position.coords.longitude);

                // Move map to user's location
                map.setView([position.coords.latitude, position.coords.longitude], 7);

                // Add marker for user location
                L.marker([position.coords.latitude, position.coords.longitude])
                    .addTo(map)
                    .bindPopup("You are here!").openPopup();

                // Fetch country code using reverse geocoding
                $.ajax({
                    url: 'libs/php/getCountryCodeA2.php',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    success: function (result) {
                        if (result.status.name === 'ok') {
                            let countryCode = result.data.countryCode;
                            console.log("🌍 Detected country code:", countryCode);

                            if (countryCode) {
                                // ✅ Update dropdown & selected country
                                $("#countrySelect").val(countryCode).trigger('change');
                                selectedCountryCode = countryCode;
                                loadCountryBorders(countryCode);

                                // ✅ Clear old markers before fetching new ones
                                Object.keys(overlays).forEach(layer => overlays[layer].clearLayers());

                                // ✅ Fetch new overlays based on detected country
                                setTimeout(() => {
                                    getOverlays();
                                }, 500); // Small delay to ensure country selection updates
                            }
                        } else {
                            console.warn("⚠️ Error: Could not fetch country code.");
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error("❌ AJAX Error getting country code:", textStatus, errorThrown);
                    }
                });
            },
            function (error) {
                console.warn("⚠️ Location access denied or unavailable. Defaulting to GB.");
                $("#countrySelect").val('GB').trigger('change');
                selectedCountryCode = 'GB';
                loadCountryBorders('GB');
                getOverlays();
            }
        );
    } else {
        console.error("❌ Geolocation not supported in this browser!");
        alert("Geolocation is not supported by your browser.");
    }
}

// jQuery-dependent Initialization
$(document).ready(function() {
    populateCountryDropdown();
    
    // Country Info Modal cleanup
    $('#countryInfoModal').off('hide.bs.modal').on('hide.bs.modal', function() {
        try {
            console.log("Closing Country Info modal...");
            $('#txtRegion, #txtCapital, #txtLanguages, #txtPopulation, #txtArea').empty();
            $('#flag').attr('src', '');
        } catch (error) {
            console.error("Error in hide.bs.modal for countryInfoModal:", error);
        }
    });
    
    // Weather Modal cleanup
    $('#weatherModal').off('hide.bs.modal').on('hide.bs.modal', function() {
        try {
            console.log("Closing Weather modal...");
            $('#weatherModalBody').empty();
        } catch (error) {
            console.error("Error in hide.bs.modal for weatherModal:", error);
        }
    });
    
    
    // Wikipedia Modal cleanup (use .html() instead of .empty() to prevent freezing)
    $('#wikiModal').off('hide.bs.modal').on('hide.bs.modal', function() {
        try {
            console.log("🛑 Closing Wikipedia modal...");
            setTimeout(() => {
                $('#wikiModalBody').html('<p>Wikipedia links and info about the selected country.</p>');
                console.log("✅ Modal content reset.");
            }, 200); // Delay by 200ms to avoid UI freezing
        } catch (error) {
            console.error("⚠️ Error closing Wikipedia modal:", error);
        }
    });

    
    
    
    // Local Time Modal cleanup
    $('#timeModal').off('hide.bs.modal').on('hide.bs.modal', function() {
        try {
            console.log("Closing Time modal...");
            $('#timeModalBody').empty();
        } catch (error) {
            console.error("Error in hide.bs.modal for timeModal:", error);
        }
    });
});



// Populate Country Dropdown
function populateCountryDropdown() {
    loading.show(); // Show loading before AJAX call

    $.ajax({
        url: 'libs/php/getSelectList.php',
        type: 'GET',
        dataType: 'json',
        success: function(result) {
            if (result.status.code === "200") {
                let dropdown = $("#countrySelect");
                dropdown.empty();
                dropdown.append('<option value="">Select a Country</option>');
                result.data.forEach(country => {
                    dropdown.append(`<option value="${country.code}">${country.name}</option>`);
                });
                // Default to United Kingdom
                dropdown.val('GB').trigger('change');
            } else {
                console.error("Error fetching country list:", result.status.description);
                $("#countrySelect").html('<option value="">Error loading countries</option>'); // Fallback
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("AJAX Error fetching country list:", textStatus, errorThrown);
            $("#countrySelect").html('<option value="">Error loading countries</option>'); // Fallback
        },
        complete: function() {
            loading.hide(); // Hide loading after AJAX call completes (success or error)
        }
    });
}