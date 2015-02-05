var servicesModule = angular.module('habitsService', []);


servicesModule.factory('HabitsService', ['$http', '$rootScope', 'authHttp', 'Environment', 'GeneralService', function($http, $rootScope, authHttp, Environment, GeneralService) {

	var habitContextHasBeenSet = false;

	var habitsService = {
		accountHabits: [],
		potentialHabits: [],
		habitData: {},
		offlineHabitData: [],


		MOOD_HABIT_ID: 1,
		SLEEP_HABIT_ID: 2,
		EXERCISE_HABIT_ID: 3,
		EATING_HABIT_ID: 4,
		WATER_HABIT_ID: 5,
		CAFFEINE_HABIT_ID: 6,
		ALCOHOL_HABIT_ID: 7,
		OUTDOORS_HABIT_ID: 8,

		// Keep track of the active date for the habits views. We can't manage
		// it using querystrings reliably.
		activeDate: undefined

	};

	// Pull any stored data out.
	var storedHabits = localStorage.getItem('accountHabits');
	if (storedHabits) {
		habitsService.accountHabits = JSON.parse(storedHabits);
	}

	// TODO, can we store arbitrary sized strings?
	var storedHabitData = localStorage.getItem('habitData');
	if (storedHabitData) {
		habitsService.habitData = JSON.parse(storedHabitData);
	}

	var storedOfflineData = localStorage.getItem('offlineHabitData');
	if (storedOfflineData) {
		habitsService.offlineHabitData = JSON.parse(storedOfflineData);

		for (var i=0; i<habitsService.offlineHabitData.length; ++i) {

			// Convert this back to a date (it got written out as a string)
			// so that we can operate on it more easily.
			var data = habitsService.offlineHabitData[i];
			data.timestamp = new Date(data.timestamp);
		}
	}

	function updateLocalAccountHabits() {
		localStorage.setItem('accountHabits', JSON.stringify(habitsService.accountHabits));
	}

	function updateStoredHabitData() {
		localStorage.setItem('habitData', JSON.stringify(habitsService.habitData));
	}

	function updateOfflineHabitData() {
		localStorage.setItem('offlineHabitData', JSON.stringify(habitsService.offlineHabitData));
	}

	habitsService.setActiveDate = function setActiveDate(date) {
		habitsService.activeDate = date;
	}

	habitsService.getActiveDate = function getActiveDate() {
		return habitsService.activeDate;
	}

	function postOfflineHabitData() {

		if (habitsService.offlineHabitData.length > 0) {

			authHttp.post(Environment.serverURL + '/habits/offline', {
					data: habitsService.offlineHabitData
				})
				.success(function() {


					// One problem here is that the context being returned from the
					// server was wrong, because it didn't have this new data. So the 
					// above habit data gets overwritten with the data returned from
					// the server, but it's missing all of this offline data.

					for (var i=0; i<habitsService.offlineHabitData.length; ++i) {
						var data = habitsService.offlineHabitData[i];

						var habit;
						for (var j=0; j<habitsService.accountHabits.length; ++j) {
							if (habitsService.accountHabits[j].id == data.habitId) {
								habit = habitsService.accountHabits[j];
								break;
							}
						} 

						habitsService.setLocalHabitData(habit, data.valueIndex, data.habitSubValueIds, data.update);
					}					
					
					habitsService.offlineHabitData.length = 0;
					localStorage.removeItem('offlineHabitData');

				});
		}
	}

	$rootScope.$on('event:online', 
    function() { 

      postOfflineHabitData();
    }
  );

	function resetData() {
		
		habitsService.accountHabits = [];
		habitsService.potentialHabits = [];
		habitsService.habitData = {};
		habitContextHasBeenSet = false;

		localStorage.removeItem('accountHabits');
		localStorage.removeItem('habitData');
		localStorage.removeItem('offlineHabitData');

	}

	habitsService.logout = function logout() {
		resetData();
	}

	// find denotes a remote call. get denotes a local request for cached data.

	// deprecated in place of user context.
	// habitsService.findAccountHabits = function findAccountHabits(account) {

	// 	return authHttp.get(Environment.serverURL + '/habits/account');
	// }

	habitsService.findHabitData = function findHabitData(d1, d2) {

		return authHttp.get(Environment.serverURL + '/habits/daily?startDate=' + GeneralService.getDayString(d1) + "&endDate=" + GeneralService.getDayString(d2));
	}


	habitsService.findPotentialAccountHabits = function findPotentialAccountHabits() {

		return authHttp.get(Environment.serverURL + '/habits/account/potential');
	}

	habitsService.setPotentialAccountHabits = function setPotentialAccountHabits(habits) {

		for (var i=0; i<habits.length; ++i) {
			var habit = habits[i];

			var found = false;
			for (var j=0; j<habitsService.potentialHabits.length; ++j) {

				if (habitsService.potentialHabits[j].id == habit.id) {
					found = true;
					break;
				}
			}

			if (!found)
				habitsService.potentialHabits.push(habit);
		}
	}

	habitsService.getPotentialAccountHabits = function getPotentialAccountHabits() {

		return habitsService.potentialHabits;
	}

	habitsService.setHabitContext = function setHabitContext(data) {

		var accountHabits = data.habitValues;
		
		// Make sure we're starting with the correct data. Sometimes things
		// get a bit out of whack with local storage having old data in it.
		habitsService.accountHabits = accountHabits;

		for (var i=0; i<accountHabits.length; ++i) {
			// These should be ordered, but just to be sure...
			habitsService.accountHabits[accountHabits[i].ordinate] = accountHabits[i];
		}

		habitsService.habitData = data.dailyHabitData.data;

		habitContextHasBeenSet = true;

		localStorage.setItem('accountHabits', JSON.stringify(habitsService.accountHabits));
		updateStoredHabitData();
	}

	habitsService.addHabitData = function addHabitData(dailyData) {

		for (var day in dailyData.data) {

			habitsService.habitData[day] = dailyData.data[day];
		}
	}

	habitsService.hasHabitContext = function hasHabitContext() {
		return habitContextHasBeenSet;
	}

	habitsService.getAccountHabitValues = function getAccountHabitValues(habitName) {

		// TODO Will eventually need a reference by ID for custom habits.
		for (var key in habitsService.accountHabits) {

			if (habitsService.accountHabits[key].name == habitName)
				return habitsService.accountHabits[key];
		}

	}

	habitsService.getAccountHabits = function getAccountHabits() {
		return habitsService.accountHabits;
	}

	habitsService.getHabitDisplay = function getHabitDisplay(habit, valueOrdinal) {
		if (habit.habitValues[valueOrdinal].valueString) {
		  return habit.habitValues[valueOrdinal].valueString;
	  }
	  else {
	  	return habit.habitValues[valueOrdinal].valueInt + ' ' + habit.habitValues[valueOrdinal].display;
	  }
	}

	habitsService.hasHabitData = function hasHabitData(d) {

		var dateString = GeneralService.getDayString(d);

		var dailyData = habitsService.habitData[dateString];
		return typeof dailyData != 'undefined';
	}

	habitsService.getHabitDataArray = function getHabitDataArray(d, habitOrdinate) {

		var dateString = GeneralService.getDayString(d);

		var dailyData = habitsService.habitData[dateString];
		if (dailyData) {

			var habit = habitsService.accountHabits[habitOrdinate];
			var habitName = habit.name;

			var habitData = dailyData[habitName];

			return habitData;
		}

	}

	habitsService.canSubmitMood = function canSubmitMood() {

		var habit = habitsService.getAccountHabitValues('Mood');

		var today = new Date();

		var daysData = habitsService.getHabitData(today, habit.ordinate);

		if (daysData) {
	    // in ms
	    var date;
	    if (typeof daysData.data.experiencedAt == 'object')
	      date = daysData.data.experiencedAt.getTime();
	    else
	      date = new Date(daysData.data.experiencedAt).getTime();

	    var now = today.getTime();

	    if (date > now - (15 * 60 * 1000)) {
	      return false;
	    }
	  }

    return true;
	}

	// this will return a small object that looks like: {
	// 	value: XXX,
	//  metGoal: XXX 
	// }
	habitsService.getHabitData = function getHabitData(d, habitOrdinate) {
		
		var dateString = GeneralService.getDayString(d);

		var dailyData = habitsService.habitData[dateString];
		if (dailyData) {

			var habit = habitsService.accountHabits[habitOrdinate];
			var habitName = habit.name;

			var habitData = dailyData[habitName];

			if (habitData) {
			  var data = habitData[0];
			  var dataValue = data.valueString ? data.valueString : data.valueInt;

			  var dataOrdinal = 0;
			  for (var i=0; i<habit.habitValues.length; ++i) {
			  	var value = habit.habitValues[i];
			  	if (value.valueString) {
			  	  if (value.valueString == data.valueString) {
				  		dataOrdinal = i;
				  		break;
				  	}
			  	}
			  	else if (value.valueInt == data.valueInt) {
			  		dataOrdinal = i;
			  		break;
			  	}
			  }

			  // Some habits have minimzed goals, like alcohol, where you want less than a number.
			  var goalMet = habit.goalMinimized ? 
			  	dataOrdinal <= habit.goalOrdinal :
			  	dataOrdinal >= habit.goalOrdinal;

			  var display = habitsService.getHabitDisplay(habit, dataOrdinal);
			  var value;
			  var valueOrdinal;

			  if (habit.habitValues[dataOrdinal].valueString) {
			  	valueOrdinal = dataOrdinal;
			  	value = habit.habitValues[dataOrdinal].valueString;
			  }
			  else {
			  	valueOrdinal = dataOrdinal;
			  	value = habit.habitValues[dataOrdinal].valueInt;
			  }

			  return {
			  	value: value,
			  	valueOrdinal: valueOrdinal,
			  	display: display,
			  	goalMet: goalMet,
			  	data: data // This is the actual data.
			  }
			}
		}
	}

	habitsService.addHabit = function addHabit(habitId) {

		return authHttp.post(Environment.serverURL + '/habits/account/add', habitId);
	}

	habitsService.addLocalHabitFromId = function addLocalHabitFromId(habitId) {

		for (var i=0; i<habitsService.accountHabits.length; ++i) {

			if (habitsService.accountHabits[i].id == habitId)
				return;	
		}

		var habit;
		for (var i=0; i<habitsService.potentialHabits.length; ++i) {

			if (habitsService.potentialHabits[i].id == habitId) {
				habit = habitsService.potentialHabits[i];
				break;
			}
		}

		habitsService.addLocalHabit(habit);
	}

	habitsService.addLocalHabit = function addLocalHabit(habit) {

		for (var i=0; i<habitsService.accountHabits.length; ++i) {
			var existing = habitsService.accountHabits[i];
			if (existing.name == habit.name) {
				console.log("Adding incorrect habit");
				return;
			}
		}

		habitsService.accountHabits.push(habit);
		habit.ordinate = habitsService.accountHabits.length-1;

		// This is gross. I think I was just doing it this way to keep it sorted.
		// delete habitsService.potentialHabits[habit.id]; // I think this is right...
		for (var i=0; i<habitsService.potentialHabits.length; ++i) {
			if (habitsService.potentialHabits[i].id == habit.id) {

				// Splice it out.
				habitsService.potentialHabits.splice(i, 1);
				break;
			}
		}


		updateLocalAccountHabits();
	}

	habitsService.removeHabit = function removeHabit(habitId) {

		return authHttp.post(Environment.serverURL + '/habits/account/remove', habitId);
	}

	habitsService.removeLocalHabit = function removeLocalHabit(habitId) {

		var habit;
		for (var i=0; i<habitsService.accountHabits.length; ++i) {
			var accountHabit = habitsService.accountHabits[i];

			if (accountHabit.id == habitId) {

				habit = accountHabit;

				habitsService.accountHabits.splice(i, 1);

				habitsService.potentialHabits.push(habit);
				break;
			}
		}

		for (var i=0; i<habitsService.accountHabits.length; ++i) {

			habitsService.accountHabits[i].ordinate = i;
		}

		updateLocalAccountHabits();
	}

	function recordOfflineHabitData(habit, valueIndex, experiencedTimestamp) {

			var now = new Date();

			habitsService.offlineHabitData.push({
				habitId: habit.id,
				habitValueId: habit.habitValues[valueIndex].id,
				valueIndex: valueIndex,
				timestamp: new Date(),
				experiencedAt: experiencedTimestamp ? experiencedTimestamp : now, 
				update: false
			});

			updateOfflineHabitData();
	}

	// The general pattern we want to adopt here is to return to the caller
	// immediately and let them go about their business. This call should
	// handle all results of the update. On failure, it will store to offline
	// data, and if it succeeds we just let it go.
	habitsService.recordHabitData = function recordHabitData(habit, valueIndex, subValueIds, experiencedTimestamp) {

		// Update the local values. We also want the object being created or updated
		// back so that we can update its ID when we get it.
		var localData = habitsService.setLocalHabitData(habit, valueIndex, subValueIds, false, experiencedTimestamp);

		if (Environment.isOnline()) {

			var data = {
				habitId: habit.id,
				habitValueId: habit.habitValues[valueIndex].id,
				habitSubValueIds: subValueIds
			};

			if (experiencedTimestamp) {
				data.experiencedAt = experiencedTimestamp;
			}

		  authHttp.post(Environment.serverURL + '/habits/record', data)
				.success(function habitSuccess(returnedId) {
					
					localData.id = +returnedId;
				})
				.error(function habitError(data, status, header, config) {

					console.log("There was an error ");
					
					// If the post failed, record the data locally.
					recordOfflineHabitData(habit, valueIndex);
				});
		}
		else {

			recordOfflineHabitData(habit, valueIndex, experiencedTimestamp);
		}		

		// How hacky is this? I'm returning something to represent the future
		// that would be provided above, because I want to call the function
		// that would be called.
		return {
			success: function(func) {

				func();
			}
		}
	}

	function setOfflineHabitData(habit, valueIndex, subValueIds, experiencedTimestamp) {

		// This is a bit tricky. We need to go through our offline data to find the
			// matching one for today. It may not be there if you recorded it online
			// and then went offline though.
			for (var i=0; i<habitsService.offlineHabitData.length; ++i) {

				var found = false;

				var data = habitsService.offlineHabitData[i];
				if (data.habitId == habit.id && 
					  GeneralService.getDayString(data.timestamp) == GeneralService.getDayString(new Date())) {

					data.habitValueId = habit.habitValues[valueIndex].id;
					data.habitSubValueIds = subValueIds;
					data.timestamp = new Date();

					found = true;
					break;
				}
			}

			if (!found) {
				habitsService.offlineHabitData.push({
					habitId: habit.id,
					habitValueId: habit.habitValues[valueIndex].id,
					habitSubValueIds: subValueIds,
					valueIndex: valueIndex,
					timestamp: new Date(),
					experiencedAt: experiencedTimestamp ? experiencedTimestamp : new Date(),
					update: true // This is important, because this particular one needs to be updated
				})
			}

			updateOfflineHabitData();
	}

	// It would be nice if we had the habitDataId, but we don't because the updates
	// may have been made locally.
	habitsService.updateHabitData = function updateHabitData(habit, valueIndex, subValueIds, experiencedTimestamp) {
		
		var updatedData = habitsService.setLocalHabitData(habit, valueIndex, subValueIds, true, experiencedTimestamp);

		if (Environment.isOnline()) {
			authHttp.post(Environment.serverURL + '/habits/update', 
				{
					habitDataId: updatedData.id,
					habitId: habit.id,
					habitValueId: habit.habitValues[valueIndex].id,
					habitSubValueIds: subValueIds
				})
			.success(function updateHabitDataSuccess() {
				// Nothing to do.
			})
			.error(function updateHabitDataError(data, status, header, config) {

				setOfflineHabitData(habit, valueIndex, subValueIds);
			});
		}
		else {

			setOfflineHabitData(habit, valueIndex, subValueIds);
		}

		// Handle the future like above.
		return {
			success: function(func) {

				func();
			}
		}
	}

	function check5Consecutive(testFunc) {

		// We could order the list of habits by date
		var dates = [];

		for (var date in habitsService.habitData) {
			dates.push(date);
		}

		dates.sort(function(a,b) {
			return new Date(b) - new Date(a);
		});

		var found = 0;

		var finished = false;

		for (var i=0; (i<dates.length) && !finished; ++i ){ 

			var date = dates[i];
			var dateHabits = habitsService.habitData[date];

			var moodList = dateHabits['Mood'];
			if (moodList) {

				for (var j=0; j<moodList.length; ++j) {

					var moodData = moodList[j];

					if (testFunc(moodData.valueInt))
						++found;
					else {
						finished = true;
						break; // We can break out the first time we don't find one.
					}

					if (found >= 5) {
						finished = true;
						break;
					}
				}
			}
		}

		return found >= 5;
	}

	habitsService.has5BadConsecutiveMoodRatings = function has5BadConsecutiveMoodRatings() {

		return check5Consecutive(function(valueInt) {
			return valueInt <= 3;
		})
	}

	habitsService.has5GoodConsecutiveMoodRatings = function has5GoodConsecutiveMoodRatings() {

		return check5Consecutive(function(valueInt) {
			return valueInt >= 5;
		})
	}

	// Return the habit data that was updated, if that is the care.
	habitsService.setLocalHabitData = function setLocalHabitData(habit, valueIndex, subValueIds, update, experiencedTimestamp) {

		// We need to be able to record a local record of the value data.
		var accountHabit = habitsService.accountHabits[habit.name];
		var value = habit.habitValues[valueIndex];

		var now = new Date();

		var experiencedAt = experiencedTimestamp ? experiencedTimestamp : now;

		var dateString = GeneralService.getDayString(experiencedAt);

		var dateHabits = habitsService.habitData[dateString];
		if (!dateHabits) {
			dateHabits = [];
			habitsService.habitData[dateString] = dateHabits;
		}

		var dataList = dateHabits[habit.name];
		if (!dataList) {
			dataList = [];
			dateHabits[habit.name] = dataList;
		}

		var dataToUpdate;

		// If we're updating, get the object out of the list to make sure we use the right ID
		if (update && dataList[0]) {
			dataToUpdate = dataList[0];
		}
		else {
			dataToUpdate = {
				experiencedAt: experiencedAt
			}
			dataList.splice(0, 0, dataToUpdate);
		}

		dataToUpdate.valueInt = value.valueInt;
		dataToUpdate.valueString = value.valueString;
		dataToUpdate.habitValueId = value.id;
		dataToUpdate.habitSubValueIds = subValueIds;
		dataToUpdate.recordedAt = now;

		updateStoredHabitData();

		return dataToUpdate;
	}

	habitsService.updateGoalOrdinal = function updateGoalOrdinal(habit) {

		return authHttp.post(Environment.serverURL + "/habits/account/updateGoal", {
			habitId: habit.id,
			goalOrdinal: habit.goalOrdinal
		})
	}

	return habitsService;

}]);