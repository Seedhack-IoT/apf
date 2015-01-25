var app = angular.module('App', [
	'angular-loading-bar',
	'ui.bootstrap',
	'ui.notify',
	'btford.socket-io']).config(['cfpLoadingBarProvider',
	    function(cfpLoadingBarProvider) {
	        cfpLoadingBarProvider.includeSpinner = true;
	        cfpLoadingBarProvider.includeBar = true;
	        cfpLoadingBarProvider.latencyThreshold = 0;
	    }
	]).config(['notificationServiceProvider', function(notificationServiceProvider) {



	}]);

	app.factory('socket', function (socketFactory) {
	  return socketFactory();
	});

var ctrl = app.controller('MainCtrl', function($scope, $http, $timeout, $filter, socket, notificationService) {

	$scope.loggedIn = false;
	$scope.sensors = [];
	$scope.login = function(){
		socket.emit("auth", $scope.username, $scope.password);

	}

	$scope.add = function(){
		var sens={
			"title":"One sensor",
			"uuid":"blablabla"
		}

		var found = $scope.sensors.some(function (sens) {
		    return el.uuid === uuid;
		  });
		if (!found)
			$scope.sensors.push(sens);
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
