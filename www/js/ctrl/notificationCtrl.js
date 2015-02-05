var ctrl = angular.module('notificationCtrl', []);

ctrl.controller('NotificationCtrl', ['$scope', '$state', '$http', '$timeout', '$analytics', '$ionicLoading', '$ionicPopup', 'AccountService', 'HabitsService', 'GoalService', 'AudioService', 'PayService', 'Environment', 'Token',
  function ($scope, $state, $http, $timeout, $analytics, $ionicLoading, $ionicPopup, AccountService, HabitsService, GoalService, AudioService, PayService, Environment, Token) {

  	$scope.notificationsUpdated = false;

  	$scope.data = {};

  	$scope.data.notifications = AccountService.getUserPreference('notification_frequency');
  	if (typeof $scope.data.notifications === 'undefined')
  		$scope.data.notifications = "1";
  	else
  		$scope.data.notifications = "" + $scope.data.notifications;

  	$scope.updateNotifications = function updateNotifications() {

  		console.log("setting notification frequency to: " + $scope.data.notifications);

  		AccountService.setUserPreference('notification_frequency', $scope.data.notifications)
  			.success(function() {

		  		$scope.notificationsUpdated = true;

		  		$timeout(function() {

		  			$scope.notificationsUpdated = false;
		  		}, 3000);
  			});
  			// TODO failure.
  	}
  }
]);