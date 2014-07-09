<?php

require 'Slim/Slim.php';

$app = new Slim();

// Routes
$app->post('/broadcasts', 'postBroadcast');
$app->delete('/broadcasts/:owner', 'deleteBroadcasts');

$app->post('/records', 'postRecords');
$app->get('/records/:token/:key', 'getRecords');
$app->delete('/records/owner/:owner', 'deleteOwnerRecords');
$app->delete('/records/token/:token', 'deleteTokenRecords');

$app->get('/tokens/:key/:code', 'getToken');

$app->run();

// Helper function
function getConnection() {
    $dbhost="localhost";
    $dbuser="db_user";
    $dbpass="db_password";
    $dbname="db_watchme";
    $dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $dbh;
}

function createToken($id, $code) {
	// key for token making
	$tokenKey = "Well isn't this just a long silly string that doesn't need to be this long or silly?";
	return (md5($id . $code . $tokenKey)); // added $tokenKey so if code is empty token won't be md5(id) which could be sniffed
}

function keyExists($id) {
    $sql = "SELECT COUNT(*) FROM broadcasts WHERE id=:id";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
       	$stmt->bindParam("id", $id);
        $stmt->execute();
        $idCount = $stmt->fetchColumn();
        $db = null;
        if($idCount > 0) {
        	return true;
        } else {
        	return false;
        }
    } catch(PDOException $e) {
        return false;
    }
}


/*
 * define handlers
 */

/*
 * start a new broadcast session
 */
function postBroadcast() {
    $request = Slim::getInstance()->request();
	
	// request comes in as json
	$broadcast = json_decode($request->getBody());
	
	// delete any exists broadcasts by this owner
	deleteBroadcasts($broadcast->owner);

    $sql = "INSERT INTO broadcasts (code, owner) VALUES (:code, :owner)";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("code", $broadcast->code);
        $stmt->bindParam("owner", $broadcast->owner);
        $stmt->execute();	
        $broadcast->id = $db->lastInsertId();
		$broadcast->token = createToken($broadcast->id, $broadcast->code);
        $db = null;
		unset($broadcast->code); // do not return the code submitted
        echo json_encode($broadcast);
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
};

/*
 * Add a new location record to a session
 */
function postRecords() {
	$request = Slim::getInstance()->request();
	$record = json_decode($request->getBody());
	
	// check for existance
	if(keyExists($record->keyValue)) {
		/*
		 * TODO: check if owner has record for this token, if so call PUT request for update
		 */
		// delete existing records by owner
		deleteOwnerRecords($record->owner);
		
		$sql = "INSERT INTO records (token, owner, latitude, longitude, accuracy, altitude, altitudeAccuracy, speed, heading, timestamp) VALUES (:token, :owner, :latitude, :longitude, :accuracy, :altitude, :altitudeAccuracy, :speed, :heading, :timestamp)";
	    try {
	        $db = getConnection();
	        $stmt = $db->prepare($sql);
	        $stmt->bindParam("token", $record->token);
	        $stmt->bindParam("owner", $record->owner);
	        $stmt->bindParam("latitude", $record->latitude);
	        $stmt->bindParam("longitude", $record->longitude);
	        $stmt->bindParam("accuracy", $record->accuracy);
	        $stmt->bindParam("altitude", $record->altitude);
	        $stmt->bindParam("altitudeAccuracy", $record->altitudeAccuracy);
	        $stmt->bindParam("speed", $record->speed);
	        $stmt->bindParam("heading", $record->heading);
	        $stmt->bindParam("timestamp", $record->timestamp);
	        $stmt->execute();
	        $record->id = $db->lastInsertId();
	        $db = null;
	        echo json_encode($record);
	    } catch(PDOException $e) {
	        echo '{"error":'. $e->getMessage() .'}';
	    }	
	} else {
		echo '{"error": "Broadcast Ended By Owner"}';
	}
}

function putRecords() {
	
}

/*
 * get records for a given token
 */
function getRecords($token, $key) {	
	// check for existance
	if(keyExists($key)) {
	    $sql = "SELECT * FROM records WHERE token=:token";
	    try {
	        $db = getConnection();
	        $stmt = $db->prepare($sql);
	       	$stmt->bindParam("token", $token);
	        $stmt->execute();
	        $records = $stmt->fetchAll(PDO::FETCH_OBJ);
	        $db = null;
	        echo '{"record": ' . json_encode($records) . '}';
	    } catch(PDOException $e) {
	        echo '{"error":'. $e->getMessage() .'}';
	    }
	} else {
		echo '{"error": "Broadcast Ended By Owner"}';
	}
}

/*
 * Delete existing records for a particular owner
 */
function deleteOwnerRecords($owner) {
    $sql = "DELETE FROM records WHERE owner=:owner";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("owner", $owner);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }	
}

/*
 * Delete existing records for a particular token
 */
function deleteTokenRecords($token) {
    $sql = "DELETE FROM records WHERE token=:token";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("token", $token);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }	
}

/*
 * Delete existing broadcasts for a particular owner
 */
function deleteBroadcasts($owner) {
    $sql = "DELETE FROM broadcasts WHERE owner=:owner";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("owner", $owner);
        $stmt->execute();
        $db = null;
    } catch(PDOException $e) {
        echo '{"error":{"text":'. $e->getMessage() .'}}';
    }
}


/*
 * fetch the token required to post from the provide key and code
 */
function getToken($key, $code) {

    $sql = "SELECT * FROM broadcasts WHERE id=:key AND code=:code";
    try {
        $db = getConnection();
        $stmt = $db->prepare($sql);
        $stmt->bindParam("key", $key);
        $stmt->bindParam("code", $code);
        $stmt->execute();
        $records = $stmt->fetchAll(PDO::FETCH_OBJ);
		if(count($records) > 0){
	        echo '{"key":"'. $key . '","owner":"'. $records[0]->owner . '","token": "' . createToken($records[0]->id, $records[0]->code) . '"}';
		} else {
			echo '{"error": "No match for provided key and code"}';
		}
        $db = null;
    } catch(PDOException $e) {
        echo '{"error": '. $e->getMessage() .'}';
    }	
}
