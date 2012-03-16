<html>
	<head>
		<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
		<title>Watch Me</title>
		<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
		<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?key=AIzaSyCBHqc-FPtbF4BcR15uyS3XsqJ0IxDHFnE&sensor=false&libraries=geometry"></script>
		<script type="text/javascript" src="js/md5.js"></script>
		<script type="text/javascript" src="js/watchme.js"></script>
	</head>
	<body>
		<span class="appTitle">Watch Me!</span>
		
		<br />
		
		<div id="keyOutput"></div> <!-- key -->
		<div id="errorLabel" style="color:red;"></div> <!-- errorLabel -->
		
		<br />
		
		<div id="inputScreen">
			<div id="startForm" class="inputForm">
				<span class="formTitle">Start A Broadcast</span><br />
				<span class="formLabel">Code:</span> <input type="text" name="code" id="broadcastCode" size="64" style="width:200px;" /><br />
				<button type="button" onclick="broadcastButton();">Broadcast</button>			
			</div> <!-- startForm -->
			
			<br /><br />
			
			<div id="watchForm" class="inputForm">
				<span class="formTitle">Watch A Broadcast</span><br />
				<span class="formLabel">Key:</span> <input type="text" name="key" id="key" size="64" value="" style="width:200px;" /><br />
				<span class="formLabel">Code:</span> <input type="text" name="code" id="code" size="64" style="width:200px;" /><br />
				<button type="button" onclick="watchButton();">Watch</button>
			</div> <!-- watchForm -->
			
			<br /><br />
		
		</div> <!-- inputScreen -->		
		
		<div id="outputScreen" style="display:none">
			
			<button id="sendButton" type="button" onclick='toggleBroadcast();'>Broadcast Location</button>

			<button type="button" onclick='stopButton();'>End Broadcast</button>
			
			<div id="map" style="width:300px; height:300px;"></div> <!-- map -->
			
			<div id="stats"></div> <!-- stats -->
						
		</div> <!-- outputScreen -->

		<div id="output"></div> <!-- output -->
	</body>
</html>