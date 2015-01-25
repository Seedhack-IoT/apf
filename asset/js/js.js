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
			"title":"One sensor",
			"uuid":"blablabla"
		},{
			"title":"Two sensor",
			"uuid":"blebleble"
		},{
			"title":"Green tree sensor",
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
