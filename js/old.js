// The root URL for the RESTful services
var rootURL = "http://databyss.com/watchme/api";
var phoneGapReady = false;
var isRunningGeo = false;
var isBroadcast = false;
var lastCenter;

// data points needed for operation
var deviceUuid = "";
var token = "";

// state variables
var sendFlag = false; // denotes whether to transmit location or not
var getFlag = false; // denotes whether to get locations from webservice or not
var updateFlag = false; // denotes whether to call the update function or not

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);

// PhoneGap is ready, set device UUID
function onDeviceReady() {
	phoneGapReady = true;
	deviceUuid = device.uuid;
	$("#uuid").html('UUID: ' + device.uuid);
	alert(deviceUuid);
	/*
	navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
	*/
}

$(function() {
	// on ready
	deviceUuid = "databyss";
	$("#uuid").html('UUID: ' + deviceUuid);
});

function clearFields() {
	$("#token").html('');			
	$("#key").html('');
	$("#output").html('');			
}

function clearForms() {
	$("#startForm #code").val();				
	$("#watchForm #key").val();				
	$("#watchForm #code").val();				
}

function startBroadcast() {
	clearFields();
    console.log('Start Broadcast');
	var inputData = startJSONData();
	if(inputData!=""){
	    $.ajax({
	        type: 'POST',
	        contentType: 'application/json',
	        url: rootURL + '/broadcasts',
	        dataType: "json",
	        data: startJSONData(),
	        success: function(data, textStatus, jqXHR){
	        	// display key for guests
	        	$('#key').text('Key: ' + data.id);

	            // load token from return into var
				token = data.token;	        	
				$('#token').text('Token: ' + data.token);
	            
	            // load map screen
	            $('#inputScreen').hide();
	            $('#outputScreen').show();
	            runGeo();
	            isBroadcast = true;
	            $('#sendButton').text('Stop Broadcasting Location');
        },
	        error: function(jqXHR, textStatus, errorThrown){
	        	clearForms();
	            $('#output').html('Start broadcast error: ' + textStatus);
	        }
	    });
	} else {
    	clearFields();					
		$('#output').html('Device not ready to broadcast');
	}
}

function watchBroadcast() {
	clearFields();
    console.log('Watch Broadcast');
    $keyVal = $("#watchForm #key").val();
    $codeVal = $("#watchForm #code").val();
    var requestUrl = rootURL + '/tokens/' + $keyVal + '/' +  $codeVal;
    if($keyVal == undefined || $codeVal == undefined) {
    	$('#output').html('Error watching broadcast: Key and Code are required.<br />');
    } else {
	    $.ajax({
	        type: 'GET',
	        contentType: 'application/json',
	        url: requestUrl,
	        dataType: "json",
	        success: function(data, textStatus, jqXHR){	
	        	if(data.token != undefined) {
		            // load token from return into var
					token = data.token;	        	
					$('#token').text('Token: ' + data.token);
					$('#key').text('Key: ' + $("#watchForm #key").val());                        			            
					clearForms();
					
					// show map screen			            
		            $('#inputScreen').hide();
		            $('#outputScreen').show();
		            //runGeo(); only broadcast if triggered

		            // write records on interval
		            
		            // get records on interval
		            getRecords();
	        	} else {
	        		// token is undefined, display error
	        		$('#output').html('Watch broadcast error: ' + data.error + '<br />');
	        	}		        	
	        },
	        error: function(jqXHR, textStatus, errorThrown){
	            $('#output').html('Start broadcast error: ' + textStatus + '<br />');
		        }
		    });
	    }
    
	}
				
function sendGeo(record) {
	$('#output').text(record);
	
    console.log('Post Record');
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: rootURL + '/records',
        dataType: "text",
        data: recordJSONData(record),
        success: function(data, textStatus, jqXHR){
        	$('#output').html('Record Sent!<br />' + data);
        },
        error: function(jqXHR, textStatus, errorThrown){
            $('#output').html('record sending error: ' + textStatus);
        }
	});
}

function getRecords() {
    console.log('Fetching records');

    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: rootURL + '/records/token/' + token,
        dataType: "json",
        success: function(data, textStatus, jqXHR){
        	console.log('Records Fetched! ' + data.record.length);
        	// load records
        	$('#output').html(data);
        	//showMap(data.record[0].latitude, data.record[0].longitude);
        	// build bounds to contain all the points
        	if(data.record.length > 1) {
	        	var bounds;
	        	for (var i = 0; i < data.record.length; i++) {
		        	if(bounds==undefined){
		        		var coord = new google.maps.LatLng(data.record[i].latitude, data.record[i].longitude);
		        		bounds = new google.maps.LatLngBounds(coord, coord);
		        	} else {
		        		bounds.extend(coord);
		        	}
	        	}
	        	if(lastCenter != undefined) {
		        	var distanceFromLast = google.maps.geometry.spherical.computeDistanceBetween(lastCenter, bounds.getCenter());
		        	$('#speed').text((distanceFromLast/3) + ' meters per second');
		        	console.log('Distance: ' + distanceFromLast);
		        	if(distanceFromLast > 1) { // reload map if moved by 1 meter
		        		showMapBounds(bounds);
		        	}
		        } else {
		        	showMapBounds(bounds);
		        }
	        	lastCenter = bounds.getCenter();
        	} else {
        		center = new google.maps.LatLng(data.record[0].latitude, data.record[0].longitude);
	        	if(lastCenter != undefined) {
		        	var distanceFromLast = google.maps.geometry.spherical.computeDistanceBetween(lastCenter, center);
		        	$('#speed').text((distanceFromLast/3) + ' meters per second');
		        	console.log('Distance: ' + distanceFromLast);
		        	if(distanceFromLast > 1) { // reload map if moved by 1 meter
		        		showMap(data.record[0].latitude, data.record[0].longitude);
		        	}				        		
	        	} else {
	        		showMap(data.record[0].latitude, data.record[0].longitude);
	        	}
        		lastCenter = center;
        	}
        	
        	
        	//alert(bounds);
        },
        error: function(jqXHR, textStatus, errorThrown){
            $('#output').html('retrieving records error: ' + textStatus + '<br />');
        }
    });
    
	// if output screen is visible, keep fetching records
	if($('#outputScreen').is(':visible')) {
    	setTimeout("getRecords();", 3000);
	}
}

function runGeo() {
	// if output screen is visible, run geo code
	if($('#outputScreen').is(':visible')) {
		isRunningGeo = true;
		// lauch the geolocation code
		navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
		// schedule it to run every 3 seconds
		setTimeout("runGeo();", 3000);
	}
}

function stopButton() {
	clearFields();
    $('#inputScreen').show();
    $('#outputScreen').hide();				
}

function startJSONData() {
	if(deviceUuid != ""){
		return JSON.stringify({
			"code": $("#startForm #code").val(),
			"owner": deviceUuid
		});
	} else {
		 $('#output').html('Device ID not set yet.');
		 return "";
	}
}
		    	    
// onSuccess Geolocation
function onGeoSuccess(position) {
	var record = position.coords;
	record.token = token;
	record.owner = deviceUuid;
	record.latitude = position.coords.latitude;
	record.longitude = position.coords.longitude;
	record.altitude = position.coords.altitude;
	record.accuracy = position.coords.accuracy;
	record.altitudeAccuracy = position.coords.altitudeAccuracy;
	record.heading = position.coords.heading;
	record.speed = position.coords.speed;
	record.timestamp = new Date(position.timestamp); //TODO: fix for iPhone which uses seconds instead of milliseconds
	
	if(isBroadcast) {
		sendGeo(record);
	}
	
    var output = 'Token: '              + record.token                 + '<br />' +
                 'Owner: '              + record.owner                 + '<br />' +
                 'Latitude: '           + record.latitude              + '<br />' +
                 'Longitude: '          + record.longitude             + '<br />' +
                 'Altitude: '           + record.altitude              + '<br />' +
                 'Accuracy: '           + record.accuracy              + '<br />' +
                 'Altitude Accuracy: '  + record.altitudeAccuracy      + '<br />' +
                 'Heading: '            + record.heading               + '<br />' +
                 'Speed: '              + record.speed                 + '<br />' +
                 'Timestamp: '          + record.timestamp			   + '<br />';
                 
	$('#geoInfo').html(output);
			                            
}

function recordJSONData(record) {
	if(deviceUuid != ""){
		return JSON.stringify({
			"token": record.token,
			"owner": record.owner,
			"latitude": record.latitude,
			"longitude": record.longitude,
			"altitude": record.altitude,
			"accuracy": record.accuracy,
			"altitudeAccuracy": record.altitudeAccuracy,
			"heading": record.heading,
			"speed": record.speed,
			"timestamp": record.timestamp
		});
	} else {
		 $('#output').html('Device ID not set yet.');
		 return "";
	}
}
	    
// onError Callback receives a PositionError object
function onGeoError(error) {
    alert('code: ' + error.code    + '\n' + 'message: ' + error.message + '\n');
}

function toggleBroadcast() {
	//TODO: implement toggleBroadcast
	var buttonText = $('#sendButton').text();
	console.log('Button text ' + buttonText);
	if(buttonText == 'Broadcast Location') {
		$('#sendButton').text('Stop Broadcasting Location');
		isBroadcast = true;
	} else {
		$('#sendButton').text('Broadcast Location');
		isBroadcast = false;
	}
}

function showMap(latitude, longitude) {
	var myOptions = {
		center: new google.maps.LatLng(latitude, longitude),
		zoom: 10,
		mapTypeId: google.maps.MapTypeId.ROADMAP 
	};

	var map = new google.maps.Map(document.getElementById("map"), myOptions);
	
}

function showMapBounds(bounds) {
	var myOptions = {
		center: bounds.getCenter(),
		zoom: 10,
		mapTypeId: google.maps.MapTypeId.ROADMAP 
	};

	var map = new google.maps.Map(document.getElementById("map"), myOptions);
	map.fitBounds(bounds);
	map.setZoom(10);
	
}
