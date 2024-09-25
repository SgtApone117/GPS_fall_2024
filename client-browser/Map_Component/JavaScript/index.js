var map = L.map('map').setView([37.978977321661155, -121.30170588862478], 16);
var stop;
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
let lastPos = null;//keep track to unecessary updates
intervalInput.addEventListener('change', startTracking); // Restart tracking when the interval input changes

// Define the getPosition function outside of onLocationFound
function getPos(position) {
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    var accuracy = position.coords.accuracy;
    if(lastPos===null || lastPos.latitude!==lat&&lastPos.longitude!==long){
        var userAgent = navigator.userAgent;
        var browserDetails = parseUserAgent(userAgent);
        console.log("Your coordinate is: Latitude: " + lat + " Long: " + long + " Accuracy: " + accuracy);
        console.log("Browser details:", browserDetails);
        lastPos = {
            latitude: lat,
            longitude: long
        };
        storeData(lat, long, accuracy, browserDetails);
    }
    else{

    }

    // Extract browser and version information from user agent
    
}

function onLocationFound(e) {
    var geocoder = L.Control.Geocoder.nominatim();
    console.log(e.latlng.lng);
    L.marker([0,0], {icon: taxiIcon}).addTo(map);
    L.Routing.control(L.extend(window.lrmConfig, {
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
                navigator.geolocation.getCurrentPosition(updatePosition)
            }, positionInterval);
        }
        // e.routes[0].coordinates.forEach(function(coord, index) {
        // 	setTimeout(() => {
        // 		marker.setLatLng([coord.lat, coord.lng])
        // 	},100 * index)
        // })
    });
    var marker_gps;
    
    function updatePosition(position){
        // console.log(position)
        
        var lat = position.coords.latitude
        var long = position.coords.longitude

        if(marker_gps) {
            console.log('removing marker');
            map.removeLayer(marker_gps)
        }
    
        marker_gps = L.marker([lat, long], {icon: taxiIcon})
    
        
    
        L.featureGroup([marker_gps]).addTo(map)
    
        //map.fitBounds(featureGroup.getBounds())
    
        // console.log("Your coordinate is: Lat: "+ lat +" Long: "+ long+ " Accuracy: "+ accuracy)
    }
}

function startTracking() {
    clearInterval(positionInterval); 
    stop=false;
    var intervalValue = parseInt(intervalInput.value) || defaultInterval;
    positionInterval = setInterval(() => {
        if (!stop) {
            navigator.geolocation.getCurrentPosition(getPos, error => {
                console.error('Geolocation error: ', error);
            });
        } else {
            clearInterval(positionInterval);
        }
    }, intervalValue);
}

function stopTracking() {
    stop=true;
}

function storeData(lat, long, accuracy, browserDetails) {
    var transaction = db.transaction(["gpsData"], "readwrite");
    var objectStore = transaction.objectStore("gpsData");

    var timestamp = new Date().toISOString();

    var data = {
        timestamp: timestamp,
        latitude: lat,
        longitude: long,
        accuracy : accuracy,
        browser: browserDetails.browser,
        version: browserDetails.version,
        OS: browserDetails.os
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
    var os = "unknown";
    var clientStrings = [
        {s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
        {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
        {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
        {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
        {s:'Windows Vista', r:/Windows NT 6.0/},
        {s:'Windows Server 2003', r:/Windows NT 5.2/},
        {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
        {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
        {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
        {s:'Windows 98', r:/(Windows 98|Win98)/},
        {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
        {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
        {s:'Windows CE', r:/Windows CE/},
        {s:'Windows 3.11', r:/Win16/},
        {s:'Android', r:/Android/},
        {s:'Open BSD', r:/OpenBSD/},
        {s:'Sun OS', r:/SunOS/},
        {s:'Chrome OS', r:/CrOS/},
        {s:'Linux', r:/(Linux|X11(?!.*CrOS))/},
        {s:'iOS', r:/(iPhone|iPad|iPod)/},
        {s:'Mac OS X', r:/Mac OS X/},
        {s:'Mac OS', r:/(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
        {s:'QNX', r:/QNX/},
        {s:'UNIX', r:/UNIX/},
        {s:'BeOS', r:/BeOS/},
        {s:'OS/2', r:/OS\/2/},
        {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
    ];
    for (var id in clientStrings) {
        var cs = clientStrings[id];
        if (cs.r.test(uaString)) {
            os = cs.s;
            break;
        }
    }

    return { browser: browser, version: version , os: os};
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
