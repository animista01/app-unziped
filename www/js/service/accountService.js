var servicesModule = angular.module('accountService', []);

servicesModule.factory('AccountService', ['$http', '$rootScope', 'authHttp', 'Environment', 'GeneralService', function($http, $rootScope, authHttp, Environment, GeneralService) {

	var accountService = {
		accountUser: {},
		userPreferences: {},
		activityContext: {},
		offlineActivities: [],
		refreshedStore: false // Used for a single refresh when the user is using the app and premium expires.
	};

	// Pull any information from local storage if it is there. This
	// will be a single string with name/value pairs.
	var localUser = localStorage.getItem("accountUser");
	if (localUser) {

		var userObj = JSON.parse(localUser);
		accountService.accountUser = userObj;
	}

	var localPreferences = localStorage.getItem('userPreferences');
	if (localPreferences) {

		var prefObj = JSON.parse(localPreferences);
		accountService.userPreferences = prefObj;
	}

	var localActivities = localStorage.getItem('offlineActivities');
	if (localActivities) {

		var activityList = JSON.parse(localActivities);
		accountService.offlineActivities = activityList;
	}

	var localContext = localStorage.getItem("activityContext");
	if (localContext) {

		var storedActivityContext = JSON.parse(localContext);
		accountService.activityContext = storedActivityContext;
	}

	function getDeviceInfo(data) {
		var deviceInfo = data ? data : {};
		if (window.device) {

			deviceInfo.appVersion = Environment.getAppVersion();
			deviceInfo.cordovaVersion = device.cordova;
			deviceInfo.model = device.model;
			deviceInfo.platform = device.platform;
			deviceInfo.uuid = device.uuid;
			deviceInfo.version = device.version;
		}

		return deviceInfo;
	}

	function postOfflineActivities() {

		if (accountService.offlineActivities.length > 0) {

			authHttp.post(Environment.serverURL + '/account/offline', {
					activities: accountService.offlineActivities
				})
				.success(function() {

					accountService.offlineActivities.length = 0;
					localStorage.removeItem('offlineActivities');
				})
		}
	}

	$rootScope.$on('event:online', 
    function() { 

      postOfflineActivities();
    }
  );

  window.enablePremiumFeatures = accountService.enablePremiumFeatures = function enablePremiumFeatures(transaction, subscriptionId, price, callback) {

  	if (accountService.canUpgrade()) {

			// We don't have the transaction anymore. Likely the user needs to log out
			// of iTunes and back in again if they are having issues with the premium
			// stuff persisting...
			if (transaction) {
				if (transaction.type == "ios-appstore") {

					authHttp.post(Environment.serverURL + '/account/verifyIOSPurchase', {

							transactionId: transaction.id,
							subscriptionId: subscriptionId,
							receipt: transaction.appStoreReceipt,
							price: price
						})
						.success(function(data) {

							console.log("Received verify response: ");
							console.log(data);

							if (data && data != 'false') {
					  		accountService.accountUser.account.premium = true;
					  		accountService.accountUser.account.paymentType = 'PURCHASE';
					  		accountService.accountUser.account.premiumExpiresAt = data;

					  		updateLocalAccountUser();
					  	}

					  	if (callback)
								callback(data);
							
						})
						.error(function habitError(data, status, header, config) {
					
							if (callback)
								callback(false);
						});
				}
				else if (transaction.type == "android-playstore") {

					console.log("Received android transaction:");
					console.log(transaction);

					// No idea if this is right yet. I can't debug it...
					authHttp.post(Environment.serverURL + '/account/verifyAndroidPurchase', {

						  transactionId: transaction.id,
							subscriptionId: subscriptionId,
							purchaseToken: transaction.purchaseToken,
							price: price
						})
						.success(function(data) {

							console.log("Received verify response: ");
							console.log(data);

							if (data && data != 'false') {
					  		accountService.accountUser.account.premium = true;
					  		accountService.accountUser.account.paymentType = 'PURCHASE';
					  		accountService.accountUser.account.premiumExpiresAt = data;

					  		updateLocalAccountUser();
					  	}

					  	if (callback)
								callback(data);
						})
						.error(function habitError(data, status, header, config) {
						
							if (callback)
								callback(false);
						});
				}
			}
  	}
  	else {
  		callback(true);
  	}
  }

  accountService.isProgressEnabled = function isProgressEnabled() {
  
  	var user = accountService.getAccountUser();

  	var creationDate = new Date(user.user.createdAtStr);

  	var now = new Date();

  	var diff = now - creationDate;

  	return diff >= (1000 * 60 * 60 * 24 * 3);
  }

  accountService.isPremiumEnabled = function isPremiumEnabled() {

  	var ret = accountService.accountUser.account && accountService.accountUser.account.premium == true;

  	// Check the date as well. The client may not have checked back in
  	// in a while.
  	if (ret) {
  		var expiresAt = new Date(accountService.accountUser.account.premiumExpiresAt);

  		ret = expiresAt > new Date();

  		// If the premium type has purchased, ann we're now expired, we might want to 
  		// reload the store to see if there is a new receipt for the user.
  		// DO NOT DO THIS MORE THAN ONCE. Way too many requests will cause the app to crash.
  		if (!ret && accountService.accountUser.account.paymentType == 'PURCHASE' && !accountService.refreshedStore) {
  			accountService.refreshedStore = true;

  			$rootScope.$broadcast('event:refreshStore');
  		}
  	}

  	return ret;
  }

  accountService.getPremiumExpiration = function getPremiumExpiration() {

  	var expires = accountService.isPremiumEnabled() ? new Date(accountService.accountUser.account.premiumExpiresAt) : undefined;

  	if (expires) {

  		return GeneralService.getDateDisplay(expires) + ' ' + GeneralService.getMinuteDisplay(expires);
  	}

  	return '';
  }

  accountService.canUpgrade = function canUpgrade() {

  	return !accountService.isPremiumEnabled() || accountService.accountUser.account.paymentType == 'TRIAL';
  }

	// This retrieves the main user context, which contains user preferencs
	// and the habit context.
	accountService.findUserContext = function(findUserContext) {

		var deviceInfo = getDeviceInfo();

		return authHttp.post(Environment.serverURL + '/account/context', deviceInfo);
	}

	accountService.createAccount = function createAccount(email, password, name) {

		var config = {};
		authHttp.addTimezone(config);

		var data = {
			email: email,
			password: password,
			name: name
		};

		getDeviceInfo(data);

		return $http.post(Environment.serverURL + '/account/create', data, config);			
	}

	accountService.resetPassword = function resetPassword(email) {

		return $http.post(Environment.serverURL + '/account/requestPasswordReset', email);
	}

	accountService.updateToken = function updateToken(headers) {

		authHttp.update(headers);
	}

	function updateLocalAccountUser() {

		localStorage.setItem("accountUser", JSON.stringify(accountService.accountUser));
	}

	function updateLocalPreferences() {

		localStorage.setItem("userPreferences", JSON.stringify(accountService.userPreferences));
	}

	function updateLocalActivities() {

		localStorage.setItem("offlineActivities", JSON.stringify(accountService.offlineActivities));
	}

	function updateLocalActivityContext() {

		localStorage.setItem("activityContext", JSON.stringify(accountService.activityContext));
	}

	accountService.setAccountUser = function setAccountUser(accountUser) {

		accountService.accountUser = accountUser;

		updateLocalAccountUser();
	}

	accountService.getAccountUser = function getAccountUser() {

		return accountService.accountUser;
	}

	accountService.setUserPreferences = function setUserPreferences(list) {
		if (list) {
			for (var i=0; i<list.length; ++i) {
				var pref = list[i];
				accountService.userPreferences[pref.preference] = pref.value;
			}
		}

		updateLocalPreferences();
	}

	accountService.getUserPreference = function getUserPreference(pref) {
		return accountService.userPreferences[pref];
	}

	accountService.login = function login(email, password) {

		var config = {};
		authHttp.addTimezone(config);

		var data = {
			email: email,
			password: password,
		};

		getDeviceInfo(data);

		return $http.post(Environment.serverURL + '/account/login', data, config);
	}

	accountService.logout = function logout() {
		
		accountService.accountUser = {};
		accountService.userPreferences = {};
		accountService.activityContext = {};
		accountService.offlineActivities = [];

		// Be sure to update these in local storage. Otherwise, if the remote
		// call fails somehow, we won't actually get logged out.
		updateLocalAccountUser();
		updateLocalPreferences();
		updateLocalActivityContext();
		updateLocalActivities();

		return authHttp.post(Environment.serverURL + '/account/logout');
	}

	accountService.ping = function ping() {

		return $http.get(Environment.serverURL + '/ping');
	}

	accountService.setUserPreference = function setUserPreference(pref, value) {

		if (!value) {
			console.log("MISSING VALUE while setting preference: " + pref);
			return;
		}

		// TODO handle offline user preferences.
		if (typeof accountService.userPreferences[pref] === 'undefined' ||
			  accountService.userPreferences[pref] != value) {

			accountService.userPreferences[pref] = value;
			updateLocalPreferences();

			return authHttp.post(Environment.serverURL + '/account/preference', {
				preference: pref,
				value: value
			});
		}
	}


	accountService.registerGCMToken = function registerGCMToken(token) {

		return authHttp.post(Environment.serverURL + '/account/gcmToken', token);
	}

	accountService.registerAPNSToken = function registerAPNSToken(token) {

		return authHttp.post(Environment.serverURL + '/account/apnsToken', token);
	}

	/******************************
	 * Activity Related Functions *
	 ******************************/

	accountService.recordActivity = function recordActivity(activity) {

		// Record the activity locally so that it will update the views.
		var list = accountService.activityContext[activity];
		if (!list) {
			list = [];
			accountService.activityContext[activity] = list;
		}

		list.push({
			recordedAt: new Date()
		});

		// Make sure we have a record of the activity in local storage.
		updateLocalActivityContext();

		if (Environment.isOnline())
			authHttp.post(Environment.serverURL + '/account/activity', activity);
		else {
			accountService.offlineActivities.push({activity: activity, timestamp: new Date() });

			updateLocalActivities();
		}

		// Advance the cycle for which goal should be handled next.
		if (activity == 'COMPLETED_BREATHING' || activity == 'COMPLETED_MUSCLE_RELAXATION') {

			if (accountService.isRelaxActive()) {

				accountService.setUserPreference('last_completed_daily_activity', 'relax');
				accountService.setUserPreference('last_completed_daily_activity_day', GeneralService.getTodayString());
			}
		}
		else if (activity == 'COMPLETED_RETHINK') {

			if (accountService.isRethinkActive()) {

				accountService.setUserPreference('last_completed_daily_activity', 'rethink');
				accountService.setUserPreference('last_completed_daily_activity_day', GeneralService.getTodayString());
			}
		}
		else if (activity == 'COMPLETED_EXPERIMENT') {

			if (accountService.isGoalsActive()) {

				accountService.setUserPreference('last_completed_daily_activity', 'goals');
				accountService.setUserPreference('last_completed_daily_activity_day', GeneralService.getTodayString());
			}
		}
	}

	accountService.setActivityContext = function setActivityContext(ctx) {

		// The dailyActiviies are a map of activity_name to a list of activities for it.
		accountService.activityContext = ctx.dailyActivities;

		updateLocalActivityContext();
	}

	accountService.getActivityCount = function getActivityCount(activity) {

		var activities = accountService.activityContext[activity];

		var count = 0;

		if (activities) {
			var todayString = GeneralService.getTodayString();

			for (var i=0; i<activities.length; ++i) {
				var activity = activities[i];

				var dayString = GeneralService.getDayString(new Date(activity.recordedAt));
				if (dayString == todayString)
					++count;

			}
		}

		return count;
	}

	accountService.getActivityHistory = function getActivityHistory() {

		return authHttp.get(Environment.serverURL + '/activity/history');
	}

	function getActivityPref() {

  	var activityPref = accountService.getUserPreference('last_completed_daily_activity');
  	return activityPref;
  }

  function activityPrefWasCompletedToday() {

  	var today = GeneralService.getTodayString();
  	var activityDayPref = accountService.getUserPreference('last_completed_daily_activity_day');

  	return activityDayPref == today;
  }

  function getDaysSinceSignup() {

  	var daysSinceSignup = 0;

  	if (accountService.accountUser.user) {
	  	var user = accountService.accountUser.user;

	  	var createdAt = GeneralService.getDayString(new Date(user.createdAtStr));

	  	var createdDay = new Date(createdAt);
	  	var today = new Date(GeneralService.getTodayString());

	  	daysSinceSignup = GeneralService.getDifferenceInDays(createdDay, today);
	  }

  	return daysSinceSignup;
  }

	accountService.isRelaxActive = function isRelaxActive() {

  	var activityPref = getActivityPref();
  	var activityDayPref = accountService.getUserPreference('last_completed_daily_activity_day');

  	// Relax is the active activity in a few different scenarios: there has been no previously
  	// completed daily activity, the previously completed daily activity was relax and the goal
  	// for it was today, or the last daily completed activity was goals and it wasn't completed today.
  	// return !activityPref || !activityDayPref ||
  	//        (activityPref == 'relax' && activityPrefWasCompletedToday()) || 
  	//        (activityPref == 'goals' && !activityPrefWasCompletedToday());

  	// Relax is enabled on day 0, and every 3 days thereafter.
  	var daysSinceSignup = getDaysSinceSignup();

  	return (daysSinceSignup % 3) == 0;
  }

  accountService.isRethinkActive = function isRethinkActive() {

  	var activityPref = getActivityPref();

  	// return (activityPref == 'rethink' && activityPrefWasCompletedToday()) ||
  	// 	     (activityPref == 'relax' && !activityPrefWasCompletedToday());

  	// Rethink is enabled on day 1, and every 3 days thereafter.
  	var daysSinceSignup = getDaysSinceSignup();

  	return (daysSinceSignup % 3) == 1;
  }

  accountService.isGoalsActive = function isGoalsActive() {

  	var activityPref = getActivityPref();

  	// return (activityPref == 'goals' && activityPrefWasCompletedToday()) ||
  	// 	     (activityPref == 'rethink' && !activityPrefWasCompletedToday());

  	// Goals enabled on day 2, and every 3 days thereafter.
  	var daysSinceSignup = getDaysSinceSignup();

  	return (daysSinceSignup % 3) == 2;
  }


	/*********************
	 *   Error Logging   *
	 *********************/

	// This is an authenticated user, so we can tie the error
	// to the person it is occurring for.
	accountService.postJSError = function postError(msg, url, line) {

		authHttp.post(Environment.serverURL + '/support/jserror', {
			msg: msg,
			url: url,
			line: line
		});
	}

	return accountService;
}]);