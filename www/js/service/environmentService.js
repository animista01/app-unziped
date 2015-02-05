

var servicesModule = angular.module('environmentService', []);


// This factory is only evaluated once, and authHttp is memorized. That is, 
// future requests to authHttp service return the same instance of authHttp 

servicesModule.factory('Environment', ['$rootScope', function($rootScope) {
	
	var configs = {

		development: {

			// localhost won't work because cookies can't be set correctly. We aren't using them anymore though.
			// serverURL: 'http://127.0.0.1:18080/app',
			serverURL: 'http://dev.thinkpacifica.com/app',

			// serverURL: 'http://54.149.102.132/app',

			gaTrackingCode: 'UA-55091509-3',
			isDebug: true
		},

		production: {

			serverURL: 'https://beta.thinkpacifica.com:443/app',
			gaTrackingCode: 'UA-55091509-4',
			isDebug: false
		}
	}

	// TODO Need to update this to deploy.
	var env = configs.production;
	
	var localData = {
		online: true, // will get overridden by the app.
		appVersion: "1.0.1"
	}

	env.isDebug = function isDebug() {

		// TODO How to pass this in?
		return true;
	}

	function onOnline() {
		console.log("ONLINE");

		localData.online = true;

		$rootScope.$broadcast('event:online');
	}

	function onOffline() {
		console.log("OFFLINE");

		localData.online = false;

		$rootScope.$broadcast('event:offline');
	}

	function onDeviceReady() {
		if (navigator && navigator.connection) {
			localData.online = navigator.connection.type != 'none'; // Connection object not available on Android?

			if (localData.online)
				onOnline();
			else
				onOffline;
		}
	}

	document.addEventListener("online", onOnline, false);
  document.addEventListener("offline", onOffline, false);
  document.addEventListener("deviceready", onDeviceReady, false);

	env.isOnline = function isOnline() {
		return localData.online;
	}

	env.isIos = function isIos() {
		return window.device && window.device.platform && window.device.platform.toLowerCase() == 'ios';
	}

	env.isAndroid = function isAndroid() {
		return window.device && window.device.platform && window.device.platform.toLowerCase() == 'android';
	}

	env.getAppVersion = function() {
		return localData.appVersion;
	}

	env.getGATrackingCode = function getGATrackingCode() {
		return env.gaTrackingCode;
	}

	return env;
}]);
