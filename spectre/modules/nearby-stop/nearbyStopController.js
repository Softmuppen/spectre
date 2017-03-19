angular.module('spectreApp.nearbyStopModule',[]).controller('NearbyStopController', ['$scope', '$interval', function($scope, $interval){
	var address = encodeURI("Norra Krokslättsgatan 2, 412 64, Gothenburg, Sweden");

	$scope.latitudePosition;
	$scope.longitudePosition;

	fetchCoordinates(function(){
		fetchVasttrafikAccessToken();
	});

	var vasttrafikApiKey = "NVk2ZjVrNEVnZ0tnWHE2dkJrbmxnRTBOdE1JYTpSVHlaU0N4Q2ZmSzE1SlA4U2picDZmQzNlaXdh";
	
	$scope.vasttrafikAccessToken;
	$scope.activeStop;
	$scope.activeStopDepartureList = [];
	$scope.nearbyStopList = [];

	$scope.$watch(
		"vasttrafikAccessToken",
		function handleTokenUpdate(newValue, oldValue){				
			if(newValue != null){
				getNearbyStops();
			}
		}
	);

	$scope.$watch(
		"activeStop",
		function handleActiveStopUpdate(newValue, oldValue){				
			if(newValue != null){
				getDepartures();
			}
		}
	);

	function fetchCoordinates(callback){
		var xhr = new XMLHttpRequest();
		var requestParams = "address=" + address;
		xhr.open( "GET", " https://maps.googleapis.com/maps/api/geocode/json?" + requestParams, true );

		xhr.onreadystatechange = function() {
			if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				responseLocation = JSON.parse(xhr.responseText).results[0].geometry.location;
				$scope.latitudePosition = responseLocation.lat;
				$scope.longitudePosition = responseLocation.lng;
				callback();
			}
		}
		xhr.send(null);
	}

	function fetchVasttrafikAccessToken(){
		var xhr = new XMLHttpRequest();
		var requestParams = "grant_type=client_credentials&scope=device_01";
		xhr.open("POST", "https://api.vasttrafik.se/token", true);

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Authorization", "Basic " + vasttrafikApiKey);

		xhr.onreadystatechange = function() {
			if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				$scope.vasttrafikAccessToken = JSON.parse(xhr.responseText).access_token;
				$scope.$digest();
			}
		}
		xhr.send(requestParams);
	}

	function getNearbyStops(){
		var xhr = new XMLHttpRequest();		
		var requestParams = "?originCoordLat=" + $scope.latitudePosition + "&originCoordLong=" + $scope.longitudePosition + "&format=json";
		xhr.open( "GET", "https://api.vasttrafik.se/bin/rest.exe/v2/location.nearbystops" + requestParams, true );

		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Authorization", "Bearer " + $scope.vasttrafikAccessToken);

		xhr.onreadystatechange = function() {
			if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				jsonResponse = JSON.parse(xhr.responseText);

				var tempNearbyStopList = [];
				jsonResponse.LocationList.StopLocation.forEach(function(stopLocation) {
    				if (stopLocation.track == null){
						tempNearbyStopList.push(stopLocation);
					}
				});

				$scope.nearbyStopList = tempNearbyStopList;

				if ($scope.activeStop == null){
					$scope.activeStop = $scope.nearbyStopList[0].name;
				}

				$scope.$digest();
			}else if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200){
				fetchVasttrafikAccessToken();
			}
		}
		xhr.send(null);
	}

	function getDepartures(){
		$scope.nearbyStopList.forEach(function(stop) {
    		if(stop.name == $scope.activeStop){
				var date = new Date();		
				var timeString = ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2);
				var dateString = date.getFullYear() + '' + ('0' + (date.getMonth()+1)).slice(-2) + '' + ('0' + date.getDate()).slice(-2);

				var xhr = new XMLHttpRequest();		
				var requestParams = "?id=" + stop.id + "&date=" + dateString + "&time=" + timeString + "&timeSpan=120" + "&format=json";
				xhr.open( "GET", "https://api.vasttrafik.se/bin/rest.exe/v2/departureBoard" + requestParams, true );

				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.setRequestHeader("Accept", "application/json");
				xhr.setRequestHeader("Authorization", "Bearer " + $scope.vasttrafikAccessToken);		

				xhr.onreadystatechange = function() {
					if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
						var tempDepartureList = [];

						jsonResponse = JSON.parse(xhr.responseText);
						jsonResponse.DepartureBoard.Departure.forEach(function(departure) {
							tempDepartureList.push(departure);
							
						});

						tempDepartureList.sort(function(b,a){
							var aMin = $scope.getMinutesUntilDeparture(a);
							var bMin = $scope.getMinutesUntilDeparture(b);
							return aMin > bMin ? -1 : 1;
						});

						$scope.activeStopDepartureList = tempDepartureList;
						$scope.$digest();
					}
				}
				xhr.send(null);
			}
		});
	}

	function getDateObject(date, time){
		dateObject = new Date(date.split("-")[0], ((date.split("-")[1])-1), date.split("-")[2], time.split(":")[0], time.split(":")[1]);
		return dateObject;
	}

	$scope.getMinutesUntilDeparture = function(departure){
		var minutesLeft;
		var currentDateTime = new Date();

		if((departure.rtDate != null) && (departure.rtTime != null)){
			var departureRtDateTime = getDateObject(departure.rtDate, departure.rtTime);
			minutesLeft = Math.floor(Math.abs(departureRtDateTime - currentDateTime) / 1000 / 60);
		}else{
			var departureDateTime = getDateObject(departure.date, departure.time);
			minutesLeft = Math.floor(Math.abs(departureDateTime - currentDateTime) / 1000 / 60);
		}
		return minutesLeft;
	}

	$scope.setActiveStop = function(stop){
		$scope.activeStop = stop;
	}

	$scope.getStopStatusClass = function(stop){
		btnClass = "default"
		if(stop.name == $scope.activeStop){
			btnClass = "primary";
		}
		return btnClass;
	}

	$interval(getDepartures, 30000);
	//$interval(fetchVasttrafikAccessToken, 3500000);
}]);
