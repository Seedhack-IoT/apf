var app = angular.module('App', [
	'angular-loading-bar',
	'ui.bootstrap',
	'ui.notify',
	'angularMoment',
	'btford.socket-io']).config(['cfpLoadingBarProvider',
	    function(cfpLoadingBarProvider) {
	        cfpLoadingBarProvider.includeSpinner = true;
	        cfpLoadingBarProvider.includeBar = true;
	        cfpLoadingBarProvider.latencyThreshold = 0;
	    }
	]).config(['notificationServiceProvider', function(notificationServiceProvider) {



	}]).constant('angularMomentConfig', {
    preprocess: 'utc', // optional
    timezone: 'Europe/London' // optional
});

	app.factory('socket', function (socketFactory) {
	  return socketFactory();
	});

var ctrl = app.controller('MainCtrl', function($scope, $http, $timeout, $filter, socket, notificationService) {

	$scope.loggedIn = true;
	$scope.sensors = [];
	$scope.login = function(){
		socket.emit("auth", $scope.username, $scope.password);

	}

	$scope.addSensor = function(sensor){
		var found = $scope.sensors.some(function (el) {
		    return el.uuid === sensor.uuid;
		  });
		if (!found)
			$scope.sensors.push(sensor);
		$timeout(function(){
			wall.refresh();
		});
	}

	$scope.updateSensor = function(update){
		var val = $.grep( $scope.sensors, function( el ) {
		    return el.uuid===update.uuid;
		});
		if (val.length==1){
			val[0]["valueTime"]=new Date();
			val[0]["value"]=update.value;
		}
	}

	$scope.addTest = function(i){
		var senses=[
		{
			"name":"One sensor",
			"uuid":"blablabla"
		},{
			"name":"Two sensor",
			"uuid":"blebleble"
		},{
			"name":"Green tree sensor",
			"uuid":"bliblibli"
		}
		];
		$scope.addSensor(senses[i]);
	}

	$scope.updateTest = function(i){
		var updates=[
		{
			"uuid":"blablabla",
			"value":Math.random()*102933214
		},{
			"uuid":"blebleble",
			"value":Math.random()*102933214
		},{
			"uuid":"bliblibli",
			"value":Math.random()*102933214
		}];
		$scope.updateSensor(updates[i]);

	}

	$scope.rainbow = function(step) {
	var numOfSteps = 50;	
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1, g = f, b = 0; break;
        case 1: r = q, g = 1, b = 0; break;
        case 2: r = 0, g = 1, b = f; break;
        case 3: r = 0, g = q, b = 1; break;
        case 4: r = f, g = 0, b = 1; break;
        case 5: r = 1, g = 0, b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return ("{width:300px; height: 300px; background-color:'"+c+"'}");
}
	socket.on("authentication", function(yes) {
/*		notificationService.notify({
			title: 'Some asshole wants to connect to our awesome system',
			text: 'Are you sure?',
			hide: false,
			confirm: {
				confirm: true
			},
			buttons: {
				closer: false,
				sticker: false
			},
			history: {
				history: false
			}
		}).get().on('pnotify.confirm', function() {
			$scope.loggedIn = true;
			notificationService.success('Bastard added');
		}).on('pnotify.cancel', function() {
			$scope.loggedIn = false;
			notificationService.error('Asshole banned from this planet')
		});*/

		$scope.loggedIn = yes;
	});

	socket.on("boolQuestion", function(id, message) {
		console.log("event:boolQuestion", id, message);
		notificationService.notify({
			title: message,
			text: 'Are you sure?',
			hide: false,
			confirm: {
				confirm: true
			},
			buttons: {
				closer: false,
				sticker: false
			},
			history: {
				history: false
			}
		}).get().on('pnotify.confirm', function() {
			notificationService.success('Bastard added');
			socket.emit("boolAnswer", id, true);
		}).on('pnotify.cancel', function() {
			notificationService.error('Asshole banned from this planet')
			socket.emit("boolAnswer", id, false);
		});
	});

})

var wall = new freewall("#freewall");
wall.reset({
	draggable: true,
	selector: '.cell',
	animate: true,
	cellW: 150,
	cellH: 150,
	onResize: function() {
		wall.refresh();
	},
	onBlockMove: function() {
		console.log(this);
	}
});
wall.fitWidth();
// for scroll bar appear;
$(window).trigger("resize");
