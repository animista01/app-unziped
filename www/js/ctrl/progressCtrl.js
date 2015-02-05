(function() {

	var ctrl = angular.module('progressCtrl', []);

	ctrl.controller('ProgressCtrl', ['$scope', '$http', '$ionicLoading', '$analytics', 'HabitsService', 'AccountService', 'GoalService', 'GeneralService',
	  function ($scope, $http, $ionicLoading, $analytics, HabitsService, AccountService, GoalService, GeneralService) {

			$ionicLoading.show({
	      template: 'Loading History...'
	    });

	    $scope.goal = AccountService.getUserPreference('user_goal');
	    if (!$scope.goal)
	    	$scope.goal = 'gad';

			// This is used to notify the directive that it can create the graph.
			$scope.hasData = false;
			$scope.showProgressEndDate = false;
			$scope.progressEndDatePosition = 0;

			// This will be the Month and day to be displayed.
			$scope.startDay;

			$scope.series = {
				moodData: [],
				missingMoodData: [],
				breatheData: [],
				rethinkData: [],
				habitData: [],
				goalData: [] 
			};

			$scope.breatheCount = 0;
			$scope.rethinkCount = 0;
			$scope.habitCount = 0;
			$scope.goalCount = 0;

			$scope.showSeries = 'habits';

			$scope.showBreathe = false;
			$scope.showRethink = false;
			$scope.showHabits = false;
			$scope.showGoals = false;

			var prefs = localStorage.getItem('showSeries');
			if (prefs) {

				var prefArray = prefs.split(',');

				for (var i=0; i<prefs.length; ++i) {

					var pref = prefArray[i];

					if (pref == 'breathe')
						$scope.showBreathe = true;
					else if (pref == 'rethink')
						$scope.showRethink = true;
					else if (pref == 'habits')
						$scope.showHabits = true;
					else if (pref == 'goals')
						$scope.showGoals = true;
				}
			}
			else {
				$scope.showBreathe = true;
			}

			function updateLocalSeriesData() {

				var series = [];

				if ($scope.showBreathe)
					series.push('breathe');
				if ($scope.showRethink)
					series.push('rethink');
				if ($scope.showHabits)
					series.push('habits');
				if ($scope.showGoals)
					series.push('goals');

				localStorage.setItem('showSeries', series.toString());
			}

			$scope.updateShowSeries = function updateShowSeries(series) {

				if (series == 'breathe')
					$scope.showBreathe = !$scope.showBreathe;
				else if (series == 'rethink')
					$scope.showRethink = !$scope.showRethink;
				else if (series == 'habits')
					$scope.showHabits = !$scope.showHabits;
				else if (series == 'goals')
					$scope.showGoals = !$scope.showGoals;

				updateLocalSeriesData();

				$analytics.eventTrack('toggleShowSeries', {category: 'progress', label: series});
			}

			// Yes these are inefficient ways to the get data. But is readable and we're only
			// talking a maximum of 30 data points, so looping over them all is quick.

			function getMoodValue(habitData, dataDate) {
				var moodValue = null;
				var moodArray = habitData[HabitsService.MOOD_HABIT_ID];

				if (moodArray) {
					for (var j=0; j<moodArray.length; ++j) {

						var moodDate = new Date(moodArray[j].date);
						if (moodDate.getDate() == dataDate.getDate() &&
							  moodDate.getMonth() == dataDate.getMonth() &&
							  moodDate.getYear() == dataDate.getYear()) { 

							// The mood value returned is actually the ordinate. We want awful to be low
						  // so modify it here.
							moodValue = 6 - moodArray[j].average;
							break;
						}
					}
				}

				return moodValue;
			}

			function getHabitCount(habitData, dataDate) {

				var habitCount = null;

				// Go through all of the habits.
				for (var key in habitData) {

					if (key != HabitsService.MOOD_HABIT_ID) {

						var habitArray = habitData[key];
						for (var i=0; i<habitArray.length; ++i) {

							var habitDate = new Date(habitArray[i].date);
							if (habitDate.getDate() == dataDate.getDate() &&
								  habitDate.getMonth() == dataDate.getMonth() &&
								  habitDate.getYear() == dataDate.getYear()) {

								habitCount += habitArray[i].count;
								break;
							}
						}
					}
				}

				return habitCount;
			}

			function getActivityCount(activityData, dataDate) {

				var activityCount = null;

				if (activityData) { 
					for (var i=0; i<activityData.length; ++i) {

						var activityDate = new Date(activityData[i].date);
						if (activityDate.getDate() == dataDate.getDate() &&
							  activityDate.getMonth() == dataDate.getMonth() &&
							  activityDate.getYear() == dataDate.getYear()) {

								activityCount += activityData[i].count;
						}
					}
				}

				return activityCount;
			}

			function getDayGoalCount(day) {

				var count = 0;

				var subGoals = GoalService.accountSubGoals;

				var dayString = GeneralService.getDayString(day);
				var daySubGoals = subGoals[dayString];

				if (daySubGoals) {
	        for (var i=0; i<daySubGoals.length; ++i) {

	          var subGoal = daySubGoals[i];
	          if (GoalService.achievedSubGoal(subGoal)) {

	            ++count;
	          }
	        }
	      }

        return count;
			}

			function getGoalCount() {

	      var count = 0;
	      var subGoals = GoalService.accountSubGoals;

	      for (var key in subGoals) {

	        count += getDayGoalCount(key);
	      }

	      return count;
			}

			// Set all of the data values into the appropriate arrays for the given date.
			function setDateValues(data, dataDate, index, shownulls) {

				// Go through the actual habit data and create the anxiety data points.
				var moodValue = getMoodValue(data.habitHistory, dataDate);

				// This is going to be a sparse graph.
				$scope.series.moodData.push({x: index, y: moodValue});	
				

				var habitCount = getHabitCount(data.habitHistory, dataDate);
				if (habitCount == null && shownulls)
					habitCount = 0;

				if (habitCount != null)
					$scope.habitCount += habitCount;

				$scope.series.habitData.push(habitCount);

				var breatheCount = getActivityCount(data.activityHistory['COMPLETED_BREATHING'], dataDate);
				if (breatheCount == null && shownulls)
					breatheCount = 0;

				if (breatheCount != null)
					$scope.breatheCount += breatheCount;

				$scope.series.breatheData.push(breatheCount);

				var rethinkCount = getActivityCount(data.activityHistory['COMPLETED_RETHINK'], dataDate);
				if (rethinkCount == null && shownulls)
					rethinkCount = 0;

				if (rethinkCount != null)
					$scope.rethinkCount += rethinkCount;

				$scope.series.rethinkData.push(rethinkCount);

				var goalCount = getDayGoalCount(dataDate);
				if (goalCount == null && shownulls)
					goalCount = 0;
				else if (goalCount == 0 && !shownulls) // weird, but getDayGoalCount always returns 0, not null like the others.
					goalCount = null;

				if (goalCount != null)
					$scope.goalCount += goalCount;

				$scope.series.goalData.push(goalCount);
			}



			function updateStartDay(date) {

				var month = getMonthAbbrev(date.getMonth());

				$scope.startDay = month + '. ' + date.getDate();
			}

	    function assembleData(data) {

	    	// How long ago was the user created? If it's less than 30 days,
	    	// the graph will be filling from the left.

	    	var today = new Date();
	    	var startDate = new Date(AccountService.getAccountUser().user.createdAtStr);

	  		// Get rid of all of the time information for the start date. We need to 
	  		// treat the start day as midnight the day they signed up. That way we
	  		// ensure that daysSinceStart is >1 on neighboring days (e.g. you sign
	  		// up at 11pm one day but use the app at 1am the next day, we need 
	  		// daysSinceStart to be >1).
	  		startDate.setHours(0,0,0,0);

	    	var daysSinceStart = dayDiff(startDate, today);

	    	console.log("day diff: " + daysSinceStart);

	    	var daysAdded = 0; 

	    	var width = $("#progressContainer").width();

	    	// In this case we're going to start from the beginning 
	    	if (daysSinceStart < 30) {

	    		updateStartDay(new Date(startDate));

	    		// The problem here is that you can have activities within
	    		// a 24 hour period that are in the same day. We need a different
	    		// way to check for this.
	    		for (var i=0; i<daysSinceStart; ++i) {

	    			// This is the corresponding date for the x axis.
	    			var dataDate = new Date(startDate).addDays(i*1);

	    			setDateValues(data, dataDate, i, true);
	    		}

	    		// This really just adds null values to fill the 30 data points.
	    		var futureDate = new Date(new Date().addDays(1))
	    		for (var i = $scope.series.moodData.length; i < 30; ++i) {

	    			setDateValues(data, futureDate, i, false);
	    		}

	    		$scope.showProgressEndDate = daysSinceStart > 14;

	    		$scope.progressEndDatePosition = width - (width * (daysSinceStart / 30));
	    	}
	    	else {

	    		// Truncate today, then back it up 30 days.
	    		today.setHours(0,0,0,0);

	    		$scope.showProgressEndDate = true;
	    		$scope.progressEndDatePosition = 0;

	    		// Use -29 because we want to count today.
	    		var dataDate = new Date(today).addDays(-29);

	    		updateStartDay(dataDate);

	    		for (var i=0; i<30; ++i) {

	    			setDateValues(data, dataDate, i, true);

	    			dataDate = dataDate.addDays(1);
	    		}
	    	}

	    	// Now that we've created the graph, we need to do a little interpolation for
	    	// the mood graph.

	    	for (var i=0; i<$scope.series.moodData.length; ++i) {

	    		var val = $scope.series.moodData[i];

	    		// Find the next value in the array.
    			var nextval = null;
    			var nextvalindex = -1;
    			for (var j=i+1; j<$scope.series.moodData.length; ++j) {

    				if ($scope.series.moodData[j].y != null) {
    					nextval = $scope.series.moodData[j].y;
    					nextvalindex = j;
    					break;
    				}
    			}


    			// This comes from the original series since we're interpolating
    			// over that one.
    			var previousval = (i >= 1) ? $scope.series.moodData[i-1].y : null;

	    		if (val.y == null) {

	    				
	    			// Go up to the next 
	    			if (nextval != null) {

	    				// If the previous value is null, advance i to the location of
	    				// the next value (we won't fill in the data if there was none).
	    				if (previousval == null) {
	    					i = nextvalindex - 1; // i will get incremented
	    				}
	    				else {
		    				var valdiff = (nextval - previousval) / (nextvalindex - i + 1);
		    				var index = 1;
		    				for (var k=i; k<nextvalindex; ++k) {

		    					// Multiple by how far we are along into the interpotation.
		    					$scope.series.missingMoodData.push({x: k, y: previousval + (valdiff * index)});

		    					++index;
		    				}

		    				i = nextvalindex-1; // i will get incremented
		    			}
	    			}
	    			else if (previousval != null && nextval != null) {
	    				$scope.series.missingMoodData.push({x: i, y: previousval});
	    			}
	    		}
	    		else {

	    			// Add bounding points to the missing data. Points in between will be interpolated.
	    			if (previousval == null || nextvalindex > i+1)
	    				$scope.series.missingMoodData.push({x: i, y: $scope.series.moodData[i].y});
	    			else
	    				$scope.series.missingMoodData.push({x: i, y: null});
	    		}
	    	}
	    	
	    	$scope.hasData = true;
	    }

	    AccountService.getActivityHistory()
	    	.success(function(data) {
	        
	        console.log("got history: ");
	        console.log(data);

	        assembleData(data);

	        $ionicLoading.hide();
	      })
	      .error(function(data, status, headers, config) {
	        $ionicLoading.hide();
	        console.log("error:" + data)
	      });
	  }
	]);

})();