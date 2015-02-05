var servicesModule = angular.module('errorService', []);


servicesModule.factory('ErrorService', function() {

	return {
		errorMessage: null, 
		setError: function(msg) {
			this.errorMessage = msg; 
		},
		clear: function() {
			this.errorMessage = null; 
		}
	};
});

// register the interceptor as a service
// intercepts ALL angular ajax HTTP calls 
servicesModule.factory('errorHttpInterceptor',
	function ($q, $location, ErrorService, $rootScope) { 
		return function (promise) {
			return promise.then(
				function (response) { 
					return response;
				}, 
				function (response) {
					if (response.status === 401) {
						$rootScope.$broadcast('event:loginRequired');
					} else if (response.status >= 400 && response.status < 500) {
		      	ErrorService.setError('Server was unable to find' +
		              ' what you were looking for... Sorry!!');
					}
					return $q.reject(response); 
				}
			);
		}; 
	}
);

// Add the error service as an interceptor.
servicesModule.config(
	function ($httpProvider) { 
		$httpProvider.responseInterceptors.push('errorHttpInterceptor');
	}
);