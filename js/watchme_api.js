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
function Application () {
	this.user =  null;
	this.broadcast = [];
	this.state = {
		sending: false,
		receiving: false,
		updating: false
	};
	
	this.initialize();
}

Application.prototype.initialize = function () {
	console.log('Application initialize.');
}

Application.prototype.addBroadcast = function (code, owner) {
	var b = new Broadcast(code, owner);
	this.broadcast.push(b);
}
// END APPLICATION CODE