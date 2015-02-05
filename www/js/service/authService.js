

var servicesModule = angular.module('authService', []);


// This factory is only evaluated once, and authHttp is memorized. That is, 
// future requests to authHttp service return the same instance of authHttp.

servicesModule.factory('authHttp', ['$http', 'Token', function($http, Token) {

	var authHttp = {};

	// Update the access token and expiration time. If the current time is less than
	// the expiration time, the sessionId will be sent back to the server.
	authHttp.update = function update(headers) {
		var headers = headers();
		var value = headers.session;

		if (value) {
			var params = value.split(";");

			var token = params[0].split("=")[1];
			var expires = params[1].split("=")[1];

			Token.update(token, expires);
		}
	}

	authHttp.removeSession = function removeSession() {

		Token.clear();
	}

	authHttp.addTimezone = function addTimezone(config) {
		config.headers = config.headers || {}; 

		// We also want to send along their timezone. This is important because the data
		// sent back needs to account for when the user will think it happened.
		var visitortime = new Date();
    var visitortimezone = 'GMT' + (-visitortime.getTimezoneOffset()/60);

    config.headers['Timezone'] = visitortimezone;
	}

  // Append the right header to the request
	var extendHeaders = function extendHeaders(config) {
		config.headers = config.headers || {};  

		if (Token.isTokenValid()) {
			config.headers['Session'] = Token.getToken();

			authHttp.addTimezone(config);
		}
		else {
			authHttp.removeSession();
		}
  };
  
  // Do this for each $http call
	angular.forEach(['get', 'delete', 'head', 'jsonp'], function(name) { 
		
		authHttp[name] = function(url, config) {
			config = config || {}; 
			extendHeaders(config);
			return $http[name](url, config);
		}; 
	
	});
	angular.forEach(['post', 'put'], function(name) { 
		
		authHttp[name] = function(url, data, config) {
			config = config || {}; 
			extendHeaders(config);
			return $http[name](url, data, config);
		}; 
	
	});

	return authHttp; 

}]);