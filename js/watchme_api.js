// RECORD CODE
function Record () {
	this.key = null;
	this.broadcast_key = null;
	this.owner = null;
	this.timestamp = null;
	this.location = {
		latitude: null,
		longitude: null,
		accuracy: null,
		altitude: null,
		altitudeAccuracy: null,
		speed: null,
		heading: null
	};
	
	this.initialize();
}

Record.prototype.intialize = function () {
	console.log('Record intialize.')
}
// END RECORD CODE

// BROADCAST CODE
function Broadcast (code, owner) {
	this.key = null;
	this.token = null;
	this.owner = null;
	this.createdDate = null;
	this.records = [];
		
	// call initialization function
	this.initialize(code, owner);
}

Broadcast.prototype.initialize = function(code, owner) {
	console.log('Broadcast intialize.')
	this.owner = owner;
	
}
// END BROADCAST CODE

// APPLICATION CODE
function Application (user, platform) {
	this.user =  null;
	this.platform = null;
	this.broadcast = null;
	this.state = {
		sending: false,
		receiving: false,
		updating: false,
		paused: false
	};
	
	this.initialize(user, platform);
}

Application.prototype.initialize = function (user, platform) {
	console.log('Application initialize.');
	this.user = user;
	this.platform = platform;
}

Application.prototype.pause = function () {
	this.state.pause = true;
}

Application.prototype.unpause = function () {
	this.state.pause = false;
}

Application.prototype.deleteBroadcast = function () {
	this.broadcast = null;
}

Application.prototype.startBroadcast = function (code) {
	if(this.broadcast !== null) {
		if (this.user !== null) {
			this.broadcast = new Broadcast(code, this.user);
		} else {
			// error message about no valid user
			console.log('application user not set.');
		}
	} else {
		console.log('Broadcast already exists, delete first.');
	}
}

Application.prototype.watchBroadcast = function (key, code) {
	if(this.broadcast !== null) {
		// watch broadcast
	} else {
		console.log('Broadcast already exists, delete first.');
	}
}
// END APPLICATION CODE