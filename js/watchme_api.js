var Application = {
	user: null,
	broadcast: null,
	state: {
		sending: false;
		receiving: false;
		updating: false;
	}
}

var Broadcast = new Object() {
	key: null,
	token: null,
	owner: null,
	createdDate: null,
	records: null
}

var Record = new Object() {
	key: null,
	broadcast_key: null,
	owner: null,
	timestamp: null,
	location: {
		latitude: null,
		longitude: null,
		accuracy: null,
		altitude: null,
		altitudeAccuracy: null,
		speed: null,
		heading: null
	}
}
