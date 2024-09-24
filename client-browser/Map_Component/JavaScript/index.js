var map = L.map('map').setView([37.978977321661155, -121.30170588862478], 16);

var marker_gps;
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var taxiIcon = L.icon({
    iconUrl: 'Images/location.png',
    iconSize: [30, 30]
});

map.locate({ setView: true, maxZoom: 16 });

var db;

function openDatabase() {
    var request = indexedDB.open("GPSDataDB", 1);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        var objectStore = db.createObjectStore("gpsData", { keyPath: "id", autoIncrement: true });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("Database opened successfully");
    };

    request.onerror = function (event) {
        console.error("Database error: ", event.target.errorCode);
    };
}

openDatabase();

var positionInterval; // Variable to store interval ID
var defaultInterval = 1000; // Default interval value
var intervalInput = document.getElementById('interval-input');
intervalInput.addEventListener('change', startTracking); // Restart tracking when the interval input changes

// Define the getPosition function outside of onLocationFound
function getPos(position) {
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    var accuracy = position.coords.accuracy;

    if (marker_gps) {
        map.removeLayer(marker_gps);
    }

    marker_gps = L.marker([lat, long], { icon: taxiIcon });
    L.featureGroup([marker_gps]).addTo(map);

    // Extract browser and version information from user agent
    var userAgent = navigator.userAgent;
    var browserDetails = parseUserAgent(userAgent);

    console.log("Your coordinate is: Lat: " + lat + " Long: " + long + " Accuracy: " + accuracy);
    console.log("Browser details:", browserDetails);

    storeData(lat, long, browserDetails);
}

function onLocationFound(e) {
    var geocoder = L.Control.Geocoder.nominatim();
    console.log(e.latlng.lng);
    var marker = L.marker([0,0], {icon: taxiIcon}).addTo(map);
    var control = L.Routing.control(L.extend(window.lrmConfig, {
        waypoints: [
            L.latLng(e.latlng.lat,e.latlng.lng)
        ],
        geocoder: geocoder,
        reverseWaypoints: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        draggableWaypoints: false,
        addGpsButton: true,
        autoRoute: true,
        altLineOptions: {
            styles: [
                {color: 'black', opacity: 0.15, weight: 9},
                {color: 'white', opacity: 0.8, weight: 6},
                {color: 'blue', opacity: 0.5, weight: 2}
            ]
        }
    })).on('routesfound', function(e) {
        console.log(e);
        if(!navigator.geolocation) {
            console.log("Your browser doesn't support geolocation feature!")
        } else {
            setInterval(() => {
                navigator.geolocation.getCurrentPosition(getPosition)
            }, 1000);
        }
        // e.routes[0].coordinates.forEach(function(coord, index) {
        // 	setTimeout(() => {
        // 		marker.setLatLng([coord.lat, coord.lng])
        // 	},100 * index)
        // })
    });
    var marker_gps, circle;
    
    function getPosition(position){
        // console.log(position)
        
        var lat = position.coords.latitude
        var long = position.coords.longitude
        var accuracy = position.coords.accuracy
        if(marker_gps) {
            console.log('removing marker');
            map.removeLayer(marker_gps)
        }
    
        marker_gps = L.marker([lat, long], {icon: taxiIcon})
    
        
    
        L.featureGroup([marker_gps]).addTo(map)
    
        //map.fitBounds(featureGroup.getBounds())
    
        console.log("Your coordinate is: Lat: "+ lat +" Long: "+ long+ " Accuracy: "+ accuracy)
    }
}    

function startTracking() {
    clearInterval(positionInterval); 
    var intervalValue = parseInt(intervalInput.value) || defaultInterval;
    positionInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(getPos);
    }, intervalValue);
}

function storeData(lat, long, browserDetails) {
    var transaction = db.transaction(["gpsData"], "readwrite");
    var objectStore = transaction.objectStore("gpsData");

    var timestamp = new Date().toISOString();

    var data = {
        timestamp: timestamp,
        latitude: lat,
        longitude: long,
        browser: browserDetails.browser,
        version: browserDetails.version
    };

    var request = objectStore.add(data);

    request.onsuccess = function () {
        console.log("Data stored successfully");
    };

    request.onerror = function (event) {
        console.error("Error storing data: ", event.target.errorCode);
    };
}

function parseUserAgent(uaString) {
    var browser = '', version = '';
    if (/chrome|crios|crmo/i.test(uaString)) {
        browser = 'Chrome';
        version = uaString.match(/(?:chrome|crios|crmo)\/([0-9\.]+)/i)[1];
    } else if (/firefox|fxios/i.test(uaString)) {
        browser = 'Firefox';
        version = uaString.match(/(?:firefox|fxios)\/([0-9\.]+)/i)[1];
    } else if (/safari/i.test(uaString) && !/chrome|crios|crmo/i.test(uaString)) {
        browser = 'Safari';
        version = uaString.match(/version\/([0-9\.]+)/i)[1];
    } else if (/msie|trident/i.test(uaString)) {
        browser = 'Internet Explorer';
        version = uaString.match(/(?:msie |rv:)([0-9\.]+)/i)[1];
    } else if (/edg/i.test(uaString)) {
        browser = 'Edge';
        version = uaString.match(/edg\/([0-9\.]+)/i)[1];
    }

    return { browser: browser, version: version };
}

function convertToCSV(objArray) {
    console.log('Converting to CSV...');
    var array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    str += 'Timestamp,Latitude,Longitude,Browser,Version\r\n';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line !== '') line += ',';
            line += array[i][index];
        }
        str += line + '\r\n';
    }
    return str;
}

function downloadCsvFile(csvContent) {
    console.log('Preparing to download CSV...');
    console.log('CSV Content:', csvContent);

    var blob = new Blob([csvContent], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'gps_history_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('CSV download triggered');
}

document.getElementById('download-btn').addEventListener('click', function () {
    console.log("Download button clicked");

    var transaction = db.transaction(["gpsData"], "readonly");
    var objectStore = transaction.objectStore("gpsData");
    var request = objectStore.getAll();

    request.onsuccess = function (event) {
        var historyData = event.target.result;

        if (historyData.length > 0) {
            var csvContent = convertToCSV(historyData);
            downloadCsvFile(csvContent);
        } else {
            console.log('No GPS data available to download.');
        }
    };

    request.onerror = function (event) {
        console.error("Error retrieving data: ", event.target.errorCode);
    };
});

document.getElementById('track').addEventListener('click', function () {
    console.log("Start Tracking");
    startTracking();
});

document.getElementById('strack').addEventListener('click', function () {
    console.log("Stopped Tracking");
    stopTracking();
});
// L.latLng(map.on('locationfound', onLocationFound))

var test = map.on('locationfound', onLocationFound);
