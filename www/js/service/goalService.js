var servicesModule = angular.module('goalService', []);

servicesModule.factory('GoalService', ['$http', '$rootScope', '$timeout', 'authHttp', 'Environment', 'GeneralService', 'AccountService',
	function($http, $rootScope, $timeout, authHttp, Environment, GeneralService, AccountService) {

	var goalService = {

		// This is the list of goals for the account.
		accountGoals: [],

		// This is a map of the current day to the list of sub goals.
		accountSubGoals: {},

		lastActiveTab: undefined
	};

	// Initialize the goals from local storage if there is anything there.
	var localGoals = localStorage.getItem('accountGoals');
	if (localGoals) {
		goalService.accountGoals = JSON.parse(localGoals);
	}

	var localSubGoals = localStorage.getItem('accountSubGoals');
	if (localSubGoals) {
		goalService.accountSubGoals = JSON.parse(localSubGoals);
	}

	function updateLocalAccountGoals() {

		localStorage.setItem('accountGoals', JSON.stringify(goalService.accountGoals));
	}

	function updateLocalAccountSubGoals() {

		localStorage.setItem('accountSubGoals', JSON.stringify(goalService.accountSubGoals));
	}

	goalService.logout = function logout() {
		goalService.accountGoals = [];
		goalService.accountSubGoals = {};
	}

	// Helper methods to store view state. location.search does not play nicely, so
	// screw it, we'll just do it here.
	goalService.getLastActiveTab = function getLastActiveTab() {
		return goalService.lastActiveTab;
	}

	goalService.setLastActiveTab = function setLastActiveTab(tab) {
		goalService.lastActiveTab = tab;
	}

	goalService.setGoalContext = function setGoalContext(ctx) {

		// We want to be careful about just replacing the goal context here. The
		// context being loaded might not have some of the offline goals that 
		// we submitted when coming back online.

		var existingGoals = goalService.accountGoals;
		var existingSubGoals = goalService.accountSubGoals;

		goalService.accountGoals = ctx.accountGoals;
		goalService.accountSubGoals = ctx.accountSubGoals;

		for (var i=0; i<existingGoals.length; ++i) {

			var goal = existingGoals[i];
			if (goal.createdOffline && !isNumeric(goal.createdOffline)) {

				var found = false;
				for (var j=0; j<goalService.accountGoals.length; ++j) {

					if (goalService.accountGoals[j].id == goal.id) {
						found = true;
						break;
					}
				}

				if (!found) {
					goalService.accountGoals.push(goal);
				}
			}
		}

		for (var day in existingSubGoals) {

			var existingDaySubGoals = existingSubGoals[day];

			for (var i=0; i<existingDaySubGoals.length; ++i) {

				var existingSubGoal = existingDaySubGoals[i];
				if (existingSubGoal.createdOffline && !isNumeric(existingSubGoal.id)) {
				
					var found = false;

					var newDaySubGoals = goalService.accountSubGoals[day];
					for (var j=0;j<existingDaySubGoals; ++j) {

						if (newDaySubGoals[j].id == existingSubGoal.id) {
							found = true;
							break;
						}
					}

					if (!found) {
						if (!goalService.accountSubGoals[day])
							goalService.accountSubGoals[day] = [];

						goalService.accountSubGoals[day].push(existingSubGoal);
					}
				}
			}
		}

		updateLocalAccountGoals();
		updateLocalAccountSubGoals();
	}

	goalService.getAccountGoals = function getAccountGoals() {
		return goalService.accountGoals;
	}

	goalService.getAccountSubGoals = function getAccountSubGoals() {
		return goalService.accountSubGoals;
	}

	goalService.getGoal = function getGoal(goalId) {

		var goal;

		var goals = goalService.accountGoals;
		for (var i=0; i<goals.length; ++i) {

			if (goals[i].id == goalId) {

				goal = goals[i];

				break;
			}
		}

		return goal;
	}

	goalService.getSubGoal = function getSubGoal(day, subGoalId) {

		var subGoal;
		var subGoals = goalService.accountSubGoals[day];

		// This should definitely exist...
		if (subGoals) {
			for (var i=0; i<subGoals.length; ++i) {

				if (subGoals[i].id == subGoalId) {

					subGoal = subGoals[i];
					break;
				}
			}
		}

		return subGoal;
	}

	goalService.getAchievedSubGoals = function getAchievedSubGoals() {

		var subGoals = goalService.accountSubGoals;

		var achieved = 0;

		var currentDay = GeneralService.getDayString(new Date());

		var daySubGoals = subGoals[currentDay];
		if (daySubGoals) {

			for (var j=0; j<daySubGoals.length; ++j) {

				var subGoal = daySubGoals[j];

				if (goalService.achievedSubGoal(subGoal))
					++achieved;
			}
		}

		return achieved;
	}

	goalService.achievedSubGoal = function achievedSubGoal(subGoal) {
	
		return subGoal.achievedRecordedAt != null && typeof subGoal.achievedRecordedAt !== 'undefined';
	}


	$rootScope.$on('event:online', 
    function() { 

      postOfflineGoals();
    }
  );

	// Check to see if anything needs to be updated.
  function updateOfflineSubGoal(subGoal) {

  	if (isNumeric(subGoal.id) && isNumeric(subGoal.goalId) && subGoal.achievedRecordedAtRequestUpdate) {

  		localAchieveSubGoal(subGoal);
  	}
  }

  function postAllOfflineSubGoals() {

  	var subGoals = goalService.accountSubGoals;
		for (var key in subGoals) {

			var daySubGoals = subGoals[key];
			for (var i=0; i<daySubGoals.length; ++i) {

				var subGoal = daySubGoals[i];

				// If we have a numeric goal Id, but not a numeric subgoal ID,
				// we can go ahead and post the goal.
				if (subGoal.createdOffline && !isNumeric(subGoal.id) && isNumeric(subGoal.goalId)) {

					// we don't want this to get marked to upload again.
					subGoal.createdOffline = false;

					authHttp.post(Environment.serverURL + '/goals/account/addSubGoal', subGoal)
						.success(function(id) {

							// Store the id so that we have it. It will also be used to determine if we have offline goals
							subGoal.id = +id;

							updateLocalAccountSubGoals();

							updateOfflineSubGoal(subGoal);
						})
						.error(function(data, status, headers, config) {

							// Try to submit it next time.
							subGoal.createdOffline = false;
			        
			        console.log("Error posting goal: " + data);

			      });
				}
			}
		}
  }

  function postOfflineSubGoals(oldGoalId, newGoalId) {

  	var subGoals = goalService.accountSubGoals;
		for (var key in subGoals) {

			var daySubGoals = subGoals[key];
			for (var i=0; i<daySubGoals.length; ++i) {

				var subGoal = daySubGoals[i];
				if (!isNumeric(subGoal.id) && subGoal.goalId == oldGoalId) {

					subGoal.goalId = newGoalId;
					updateLocalAccountSubGoals();

					authHttp.post(Environment.serverURL + '/goals/account/addSubGoal', subGoal)
						.success(function(id) {

							// Store the id so that we have it. It will also be used to determine if we have offline goals
							subGoal.id = +id;

							updateLocalAccountSubGoals();

							updateOfflineSubGoal(subGoal);
						})
						.error(function(data, status, headers, config) {

			        // TODO Add to offline list
			        console.log("Error posting goal: " + data);

			      });
				}
				else {
					updateOfflineSubGoal(subGoal);
				}
			}
		}
  }

	function postOfflineGoals() {

		// First post any sub-goals that already have goal IDs. Once we post 
		// any goals created offline, we'll individually post the associated
		// sub-goals.
		postAllOfflineSubGoals();

		var goals = goalService.accountGoals;
		for (var i=0; i<goals.length; ++i) {

			var goal = goals[i];
			if (!goal.id || !isNumeric(goal.id)) {

				authHttp.post(Environment.serverURL + '/goals/account/addGoal', {
					title: goal.title,
					color: goal.color
				})
					.success(function(id) {

						var oldGoalId = goal.id;

						// Store the id so that we have it.
						goal.id = +id;

						// Now that we have the id, we need to update any subgoals with the old ID
						postOfflineSubGoals(oldGoalId, goal.id);

						// Again, write the data to local storage so that the id is there. This id
						// will be used to determine whether or not we've recorded any offline data.
						updateLocalAccountGoals();
		  		})
		  		.error(function(data, status, headers, config) {

		        // TODO Add to offline list
		        console.log("Error posting goal: " + data);

		      });
			}
		}
	}

	goalService.addGoal = function addGoal(title, color) {

		var newGoal = {
			title: title,
			color: color,
			createdAt: new Date().getTime()
		};

		// Add the goal to our local set of goals.
		goalService.accountGoals.push(newGoal)

		// Write the data to local storage.
		updateLocalAccountGoals();

		var localCallback = undefined;

		// Trying something new. This returns like a promise and the success attribute will get set.
		var ret = { 
			success: function(callback) {
	
				localCallback = callback;
			}
		}

		if (Environment.isOnline()) {
			authHttp.post(Environment.serverURL + '/goals/account/addGoal', {
				title: title,
				color: color
			})
				.success(function(id) {

					// Store the id so that we have it.
					newGoal.id = +id;

					// Again, write the data to local storage so that the id is there. This id
					// will be used to determine whether or not we've recorded any offline data.
					updateLocalAccountGoals();

	  			if (localCallback)
	  				localCallback();
	  		})
	  		.error(function(data, status, headers, config) {

	        // TODO Add to offline list
	        console.log("Error posting goal: " + data);

	      });
	  }
	  else {

	  	// The goal needs an id in order for sub goals to be correctly initialized.
	  	newGoal.id = generateGUID();
	  	newGoal.createdOffline = true;

	  	updateLocalAccountGoals();

	  	$timeout(function() {
	  		if (localCallback)
	  				localCallback();
	  		});
	  }

    return ret;
	}

	goalService.archiveGoal = function archiveGoal(goalId) {

		var goals = goalService.accountGoals;
		for (var i=0; i<goals.length; ++i) {

			if (goals[i].id == goalId) {

				goals.splice(i, 1);

				updateLocalAccountGoals();

				// Remove any associated sub goals
				for (var key in goalService.accountSubGoals) {

					var daySubGoals = goalService.accountSubGoals[key];
					for (var j=daySubGoals.length-1; j>=0; --j) {

						var subGoal = daySubGoals[j];
						if (subGoal.goalId == goalId) {

							daySubGoals.splice(j, 1);
						}
					}
				}

				updateLocalAccountSubGoals();

				break;
			}
		}

		return authHttp.post(Environment.serverURL + '/goals/account/archiveGoal', goalId);
	}

	goalService.updateGoal = function updateGoal(goalId, title, color) {

		var goal = goalService.getGoal(goalId);

		if (goal) {

			goal.title = title;
			goal.color = color;

			updateLocalAccountGoals();

			if (Environment.isOnline()) {
				return authHttp.post(Environment.serverURL + '/goals/account/updateGoal', {
					goalId: goal.id,
					title: goal.title,
					color: goal.color
				});
			}
			else {
				return {
					success: function(callback) {

						if (callback) 
							callback();
					}
				}
			}
		}
	}

	goalService.addSubGoal = function addSubGoal(goalId, title, day, difficulty) {

		var newSubGoal = {
			goalId: goalId,
			title: title,
			day: day,
			difficulty: difficulty
		};

		var subGoalList = goalService.accountSubGoals[day];

		if (!subGoalList) {
			subGoalList = [];
			goalService.accountSubGoals[day] = subGoalList;
		}

		// Add the sub goal to our local set of sub goals.
		subGoalList.push(newSubGoal)

		// Write the data to local storage.
		updateLocalAccountSubGoals();

		var localSucessCallback = undefined;

		// Trying something new. This returns like a promise and the success attribute will get set.
		var ret = { 
			success: function(callback) {
	
				localCallback = callback;
			}
		}

		if (Environment.isOnline()) {
			authHttp.post(Environment.serverURL + '/goals/account/addSubGoal', newSubGoal)
				.success(function(id) {

					// Store the id so that we have it. It will also be used to determine if we have offline goals
					newSubGoal.id = +id;

					updateLocalAccountSubGoals();

					if (localCallback)
	  				localCallback();
				})
				.error(function(data, status, headers, config) {

	        // TODO Add to offline list
	        console.log("Error posting goal: " + data);

	      });
		}
		else {

			// Need to be able to reference it.
			newSubGoal.id = generateGUID();
			newSubGoal.createdOffline = true;

			updateLocalAccountSubGoals();

			$timeout(function() {
	  		if (localCallback)
	  				localCallback();
	  		}
	  	);
		}

		return ret;
	}

	function localAchieveSubGoal(subGoal) {

		if (subGoal) {

			// This could be getting passed in to handle an offline update.
			if (!goalService.achievedSubGoal(subGoal)) {
				subGoal.achievedRecordedAt = new Date().getTime();
				subGoal.achievedRecordedAtString = new Date().toString();

				updateLocalAccountSubGoals();

				// This is used to advance the daily activity.
				AccountService.recordActivity('COMPLETED_EXPERIMENT');
			}
		}

		if (Environment.isOnline()) {
			return authHttp.post(Environment.serverURL + '/goals/account/achieveSubGoal', subGoal.id);
		}
		else {

			subGoal.achievedRecordedAtRequestUpdate = true;

			return {
				success: function() {}
			}
		}
	}

	goalService.achieveSubGoal = function achieveSubGoal(day, subGoalId) {

		var goalToUpdate = goalService.getSubGoal(day, subGoalId);

		return localAchieveSubGoal(goalToUpdate);
	}

	goalService.archiveSubGoal = function archiveSubGoal(day, subGoalId) {

		var subGoals = goalService.accountSubGoals[day];

		if (subGoals) {

			var subGoal = goalService.getSubGoal(day, subGoalId);

			var index = subGoals.indexOf(subGoal);
			if (index >=0) {
				subGoals.splice(index, 1);

				updateLocalAccountSubGoals();

				return authHttp.post(Environment.serverURL + '/goals/account/archiveSubGoal', subGoalId);
			}
		}
	}

	goalService.updateSubGoal = function updateSubGoal(subGoalId, goalId, title, day, difficulty) {

		var subGoal = goalService.getSubGoal(day, subGoalId);

		if (subGoal) {

			subGoal.goalId = goalId;
			subGoal.day = day;
			subGoal.title = title;
			subGoal.difficulty = difficulty;

			updateLocalAccountSubGoals();

			if (Environment.isOnline()) {
				return authHttp.post(Environment.serverURL + '/goals/account/updateSubGoal', {
						subGoalId: subGoalId,
						goalId: goalId,
						title: title,
						day: day,
						difficulty: difficulty
					}
				);
			}
			else {
				return {
					success: function(callback) {

						if (callback) 
							callback();
					}
				}
			}
		}
	}	

	return goalService;

}]);