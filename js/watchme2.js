/*
 * THINGS I WANT TO DO!
 * resume on load
 * checkbox to lock map
 * reset button to fit all people
 * give user name entry for label
 * show single user stats
 * 
 */
 
// The root URL for the RESTful services
var rootURL = "http://databyss.com/watchme/api";
var lastCenter; // stores the last map center for comparison
var updateDelay = 3000; // 3 second update interval
var geoWatcher = false; //TODO: remove if not using watchPosition
var map;
var markers = new Object();
var oldRecords = new Object();
var forceMapUpdate = false; // when a person changes force an update

// define global Application object
var app = null;

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);

// PhoneGap is ready, set device UUID
function onDeviceReady() {
	// check objects
	if (app === null) {
		// initialize app with device id and platform
		app = new Application(device.uuid, device.platform);	
	}
	
	document.addEventListener("pause", onAppPaused, false);
	document.addEventListener("resume", onAppResumed, false);
}

function onAppPaused() {
	app.pause();
	navigator.geolocation.clearWatch(geoWatcher);
	geoWatcher = false;
}

function onAppResumed() {
	app.unpause();
	update();
}

$(function() {
	// on ready
	
	// check objects
	if (app === null) {
		// initialize app with device id and platform
		app = new Application(hex_md5(navigator.userAgent), 'browser');	
	}

});

/*
 * Functions to handle state changes from user input
 */
function broadcastButton() {
	// clear error state notification
	$('#errorLabel').text('');
	
	// validate code
	var inputCode = $("#startForm #broadcastCode").val();	
	if(inputCode == "") {
		return JSON.stringify({
			"error": 'Invalid code. Must be between 1 and 64 characters.'
		});	
	}

	try {
		app.startBroadcast(inputCode);
	} catch(e) {
		console.log('error creating broadcast: ' + e);
		$('#errorLabel').text('Error: ' + e);
	}
}

function watchButton() {
	// error on input data
	$('#errorLabel').text('');

	// verify key/code
	var key = $("#watchForm #key").val();
	var code = $("#watchForm #code").val();

	if(key == ""){
		// error on input data
		$('#errorLabel').text('Error: Key needs to be supplied');
		return;
	} else if(code == "") {
		// error on input data
		$('#errorLabel').text('Error: Code needs to be supplied');
		return;
	} 
	
	try {
		app.watchBroadcast(key, code);
	} catch(e) {
		console.log('error creating broadcast: ' + e);
		$('#errorLabel').text('Error: ' + e);
	}
	
}

function stopButton() {
	// update status
	navigator.geolocation.clearWatch(geoWatcher);
	geoWatcher = false;
	
	// update interface
	$('#inputScreen').show();
	$('#outputScreen').hide();
	$('#keyOutput').text('');
	$('#output').html('');
	clearForms();
	$('#sendButton').text('Broadcast Location');

	app.deleteBroadcast();
}

function toggleBroadcast() {
	var buttonText = $('#sendButton').text();
	
	// handle button text
	if(buttonText == 'Broadcast Location') {
		$('#sendButton').text('Stop Broadcasting Location');
		
		app.startTransmiting();
	} else {
		$('#sendButton').text('Broadcast Location');
		
		// disable watcher
		navigator.geolocation.clearWatch(geoWatcher);
		geoWatcher = false;

		app.endTransmiting();		
	}
}

function update() {
	if(!pauseFlag) {
		// overall update flag
		if(updateFlag) {
			// check send flag
			if(sendFlag) {
				// get device coordinates
				if(geoWatcher == false) {
					geoWatcher = navigator.geolocation.watchPosition(onGeoSuccess, onGeoError, { frequency: updateDelay, timeout: 5000, enableHighAccuracy: true});
				}				
			}
			
			// check get flag
			if(getFlag) {
				if(application.token != "") {
					// fetch records from web service
					if(application.token != "") {
						getRecords(application.token, application.key);
					}
				}						
			}
			
			// set update delay
			setTimeout("update();", updateDelay);
		}
	}
}

/*
 * Functions to handle webservice interaction
 */
function createBroadcast(inputData) {
	// validate input data
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: rootURL + '/broadcasts',
		dataType: "json",
		data: inputData, 
		success: function(data, textStatus, jqXHR) {
			// store result into application state
			application.key = data.id;
			application.token = data.token;
			application.broadcastOwner = application.deviceUuid;
			
			// show user the key        	
			alert('Broadcast Key: ' + application.key);			
			$('#keyOutput').text('Key: ' + application.key);
			
			// update interface
			$('#inputScreen').hide();
			$('#outputScreen').show();
			
			// update status
			sendFlag = true;
			getFlag = true;
			updateFlag = true;
			$('#sendButton').text('Stop Broadcasting Location');
			
			// start updater
			update();
		},
		error: function(jqXHR, textStatus, errorThrown){
			// display error
			console.log('post error!' + textStatus + errorThrown);
			$('#errorLabel').text('Error: ' + errorThrown);
		}
	});
}

function getToken(key, code) {
	$('#keyOutput').text('');

	var requestUrl = rootURL + '/tokens/' + key + '/' +  code;
	$.ajax({
		type: 'GET',
		contentType: 'application/json',
		url: requestUrl,
		dataType: "json",
		success: function(data, textStatus, jqXHR){	
			if(data.error == undefined) {
				// load key and token from api
				application.key = data.key;	        	
				application.token = data.token;
				
				// update interface
				$('#inputScreen').hide();
				$('#outputScreen').show();
				
				// update status
				sendFlag = false;
				getFlag = true;
				updateFlag = true;
				navigator.geolocation.clearWatch(geoWatcher);
				geoWatcher = false;
				
				// start updater
				update();
			} else {
				// token is undefined, display error
				console.log('Unable to get a token for the provided key and code: ' + data.error);
				$('#errorLabel').text('Unable to get a token for the provided key and code.');
			}
		},
		error: function(jqXHR, textStatus, errorThrown){
			// error with get request
			console.log('Error: ' + errorThrown);
			$('#errorLabel').text('Unable to get a token for the provided key and code.');
		}
	});
}

function onGeoSuccess(position) {
	var record = position.coords;
	record.keyValue = application.key;
	record.token = application.token;
	record.owner = application.deviceUuid;
	record.latitude = position.coords.latitude;
	record.longitude = position.coords.longitude;
	record.altitude = position.coords.altitude;
	record.accuracy = position.coords.accuracy;
	record.altitudeAccuracy = position.coords.altitudeAccuracy;
	record.heading = position.coords.heading;
	record.speed = position.coords.speed;
	// iPhone uses seconds instead of milliseconds, adjust so it matches
	if(application.platform == "iPhone" || application.platform == "iOS") {
		record.timestamp = position.timestamp * 1000;
	} else {
		record.timestamp = position.timestamp;	
	}
	
	if(sendFlag) {
		sendGeo(record);
	}			                            
}

function onGeoError(error) {
	console.log('code: ' + error.code    + '\n' + 'message: ' + error.message + '\n');
	$('#errorLabel').text('code: ' + error.code    + '\n' + 'message: ' + error.message + '\n');
}

function sendGeo(record) {
	$('#errorLabel').text('');
	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: rootURL + '/records',
		dataType: "json",
		data: recordJSONData(record),
		success: function(data, textStatus, jqXHR){
			// record sent! YAY!
			if(data.error == undefined) {
				// success!
			} else {     		
				if(data.error == 'Broadcast Ended By Owner') {
					sendFlag = false;
					navigator.geolocation.clearWatch(geoWatcher);
					geoWatcher = false;
					getFlag = false;
					updateFlag = false;
					alert(data.error);
				} else {
					// token is undefined, display error
					console.log('Error: ' + data.error);
					$('#errorLabel').text('Error sending record to the webservice.');
				}
			}
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('Error: ' + errorThrown);
			$('#errorLabel').text('Unable to send record to the webservice.');
		}
	});
}

function getRecords(token, key) {
	$.ajax({
		type: 'GET',
		contentType: 'application/json',
		url: rootURL + '/records/' + token + '/' + key,
		dataType: "json",
		success: function(data, textStatus, jqXHR){
			if(data.error == undefined) {
				console.log(data.record.length + ' records received.');
				
				// update map
				updateMap(data.record);
				
				// update statistics
				updateStatistics(data.record);
			} else {
				if(data.error == 'Broadcast Ended By Owner') {
					sendFlag = false;
					navigator.geolocation.clearWatch(geoWatcher);
					geoWatcher = false;
					getFlag = false;
					updateFlag = false;
					alert(data.error);
				} else {
					// token is undefined, display error
					console.log('Error: ' + data.error);
					$('#errorLabel').text('Error sending record to the webservice.');
				}
				
			}

		},
		error: function(jqXHR, textStatus, errorThrown){
			$('#output').html('Error retrieving records: ' + textStatus + '<br />');
		}
	});
}

function updateMap(records) {
	//TODO: check input status in success handlers to make sure we're not updating off screen items
	// pan to new center if map isn't created -- put this in updateMap function
	var bounds
	for (var i = 0; i < records.length; i++) {
		if(bounds == undefined){
			var coord = new google.maps.LatLng(records[i].latitude, records[i].longitude);
			bounds = new google.maps.LatLngBounds(coord, coord);
		} else {
			bounds.extend(new google.maps.LatLng(records[i].latitude, records[i].longitude));
		}
	}
	
	if(bounds != undefined) {
		if(map == undefined) {
			var myOptions = {
				center: bounds.getCenter(),
				zoom: 10,
				mapTypeId: google.maps.MapTypeId.ROADMAP 
			};
		
			map = new google.maps.Map(document.getElementById("map"), myOptions);
	
		} else {
			// map is already created
			if(forceMapUpdate) {
				// do checks here to resize map when necessary

				// if there is only one coordinate, don't change the zoom
				var oldZoom = -1;
				if(records.length == 1) {
					oldZoom = map.getZoom();
				}
				
				for (var i = 0; i < records.length; i++) {
					if(!map.getBounds().contains(new google.maps.LatLng(records[i].latitude, records[i].longitude))) {
						map.fitBounds(bounds);
					}
				}
				
				if(oldZoom != -1) {
					map.setZoom(oldZoom);
				}
				
				// reset since map was updated				
				forceMapUpdate = false;
			}
		}
		
	}
	
	// set all markers to false!
	$.each(markers, function(key, value) { 
		markers[key].updated = false;
	});

	// make a marker for each record
	for (var i = 0; i < records.length; i++) {
		if(markers[records[i].owner] == undefined) {
			forceMapUpdate = true;
			markers[records[i].owner] = new Object();
			markers[records[i].owner].marker = new google.maps.Marker({
				position: new google.maps.LatLng(records[i].latitude, records[i].longitude),
				animation: google.maps.Animation.DROP,
				map: map
			});
			markers[records[i].owner].updated = true; // flag each record as updated so it's not deleted
		} else {
			// marker already exists, update position
			markers[records[i].owner].marker.setPosition(new google.maps.LatLng(records[i].latitude, records[i].longitude));
			markers[records[i].owner].updated = true; // flag each record as updated so it's not deleted
		}
	}
	
	// look for not updated markers for deletion
	$.each(markers, function(key, value) { 
		if(markers[key].updated == false) {
			markers[key].marker.setMap(null);
			delete(markers[key]);
			forceMapUpdate = true;
		}
	});
}

function updateStatistics(records) {
	//TODO: Do something!
	var statsDiv = $('#stats');
	statsDiv.text('');
	
	if(records.length > 1) {
		// 2+ person stats
		var distance = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(records[0].latitude, records[0].longitude), new google.maps.LatLng(records[1].latitude, records[1].longitude));
		statsDiv.html('<br />Distance: ' + distance.toFixed(3) + ' meters');
		
		// assuming masses of 68.0388555Kg ~150lbs.
		var gravity = new Number(((68.0388555 * 68.0388555) / (distance * distance)) * 0.00000000006673);
		statsDiv.html(statsDiv.html() + '<br />Gravity Between: ' + gravity.toPrecision(6) + ' Newtons (assuming 150lbs mass of each)');
	}	
}

function deleteBroadcast(owner) {
	// first delete records for this broadcast
	deleteTokenRecords(application.token);

	$.ajax({
		type: 'DELETE',
		url: rootURL + '/broadcasts/' + owner,
		success: function(data, textStatus, jqXHR){
			application.token = "";
			application.key = "";
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error deleting broadcast. ' + errorThrown);
		}
	});
}

function deleteTokenRecords(token) {
	$.ajax({
		type: 'DELETE',
		url: rootURL + '/records/token/' + token,
		success: function(data, textStatus, jqXHR){
			// success
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error deleting token records. ' + errorThrown);
		}
	});
}

function deleteOwnerRecords(owner) {
	$.ajax({
		type: 'DELETE',
		url: rootURL + '/records/owner/' + owner,
		success: function(data, textStatus, jqXHR){
			// success
		},
		error: function(jqXHR, textStatus, errorThrown){
			console.log('error deleting token records. ' + errorThrown);
		}
	});
}

/*
 * Utility functions
 */
function clearForms() {
	$("#startForm #broadcastCode").val();				
	$("#watchForm #key").val();				
	$("#watchForm #code").val();				
}

function broadcastJSONData() {
	// validate uuid
	if(application.deviceUuid == "") {
		return JSON.stringify({
			"error": 'Invalid device uuid.'
		});		
	}
	

	// both validated, return JSON object
	return JSON.stringify({
		"code": inputCode,
		"owner": application.deviceUuid
	});
}

function recordJSONData(record) {
	if(application.deviceUuid != ""){
		return JSON.stringify({
			"keyValue": record.keyValue,
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

