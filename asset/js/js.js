var app = angular.module('App', [
	'angular-loading-bar',
	'ui.bootstrap',
	'ui.notify',
	'angularMoment',
	'ui.select2',
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

var hack;

var secondCtrl = app.controller('secondCtrl', function($scope, socket, notificationService) {
	$scope.addConditional = function(device, sensor, value, actuator, action) {
		socket.emit("add_conditional", device, sensor, value, actuator, action);
	}

	$scope.SaveIt = function(model) {
		$scope.addConditional(model.device, model.sensor, model.value, model.actuator, model.action);
		$scope.active=false;
	}
	$scope.mdl = {};
	$scope.active = false;
	$scope.toggle = function() { $scope.active = !$scope.active; };
	$scope.dbg = function(arg) {
		if (arg !== undefined) {
			$scope.mdl.actions = $scope.$parent.devices[arg].actions;
			console.log($scope.mdl.actions);
		}
	};
})

var ctrl = app.controller('MainCtrl', function($scope, $http, $timeout, $filter, socket, notificationService) {
	socket.emit("auth", "river", "thisisme");
	hack = socket;
	$scope.loggedIn = true;
	$scope.devices = {};
	$scope.iftttSensor = null;
	$scope.login = function(){
		socket.emit("auth", $scope.username, $scope.password);
	}

	$scope.setIfttt = function(s){
		if (s===null){
			notificationService.success('IFTTT action saved');

		}
		$scope.iftttSensor = s;

	}

	$scope.addDevice = function(device){
		if(!$scope.devices.hasOwnProperty(device["uuid"])){
			$scope.devices[device["uuid"]]=device;
		}
		// var found = $scope.devices.some(function (el) {
		//     return el.uuid === device.uuid;
		//   });
		// if (!found)
		// 	$scope.devices.push(device);
	}

	$scope.changeDeviceStatus = function(uuid, active){
		$scope.devices[uuid].active=active;
	}

	$scope.updateDevice = function(uuid, sensor, data){
		console.log("event:sensor_reading", uuid, sensor, data);
		console.log($scope.devices);
		var s = $scope.devices[uuid].sensors[sensor];
		if (s === undefined) {
			$scope.devices[uuid].sensors[sensor] = {name:"sensor", value: data, valueTime: new Date()};
		}

		$scope.devices[uuid].sensors[sensor].valueTime = new Date();
		// var val = $.grep( $scope.devices, function( el ) {
		//     return el.uuid===update.uuid;
		// });
		// if (val.length==1){
		// 	val[0].sensors[update["name"]].value=update.value;
		// 	val[0].sensors[update["name"]].valueTime=new Date();
		// 	// val[0]["valueTime"]=new Date();
		// 	// val[0]["value"]=update.value;
		// }
	}

	$scope.doAction = function(device, action){
		socket.emit("action",device.uuid, action);
		notificationService.success('Action <b>'+action+'</b> transmitted');
	}

	socket.on("device_data", function(device) {
		console.log("event:device_data", device);
		$scope.devices[device.uuid] = device;
	});

	socket.on("sensor_reading", function(uuid, sensor, data) {
		console.log("event:sensor_reading", uuid, sensor, data);
		if (sensor == "camera") {
			var win = window.open("data:image/gif;base64,"+data, '_blank');
			win.focus();
		}
		$scope.updateDevice(uuid,sensor,data);
	});

	socket.on("device_offline", function(uuid) {
		console.log("event:device_offline", uuid);
		$scope.changeDeviceStatus(uuid,false);
	});

	$scope.addConditional = function(device, sensor, value, actuator, action) {
		socket.emit("add_conditional", device, sensor, value, actuator, action);
	}

	socket.on("conditional_added", function(success) {
		console.log("event:conditional_added", success);
		notificationService.success('If this than than added.');
	})
	$scope.addTest = function(i){

		var devices=[
		{
			"name":"One device",
			"uuid":"blablabla",
			"sensors": {"pressure":{"name":"sensor 1"},"temp":{"name":"sensor 2"}},
			"actions": ["actiunea 1", "actiunea 2"],
			"active":true
		},{
			"name":"Two device",
			"uuid":"blebleble",
			"sensors": {"sensor 3":{"name":"sensor 3"},"sensor 4":{"name":"sensor 4"}},
			"actions": ["actiunea 6", "actiunea 5"],
			"active":true

		},{
			"name":"Green tree device",
			"uuid":"bliblibli",
			"sensors": {"sensor 5":{"name":"sensor 5"},"sensor 6":{"name":"sensor 6"}},
			"actions": ["actiunea 1", "actiunea 2"],
			"active":true
		}
		];
		$scope.addDevice(devices[i]);
	}

	$scope.updateTest = function(i){
		var updates=[
		{
			"uuid":"blablabla",
			"sensor":"pressure",
			"data":Math.random()*102933214
		},{
			"uuid":"blebleble",
			"sensor":"sensor 4",
			"data":Math.random()*102933214
		},{
			"uuid":"bliblibli",
			"sensor":"sensor 5",
			"data":Math.random()*102933214
		}];
		$scope.updateDevice(updates[i]["uuid"],updates[i]["sensor"],updates[i]["data"]);

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
		console.log("event:authentication", yes)
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
