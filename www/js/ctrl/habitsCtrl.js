(function() {

  var ctrl = angular.module('habitsCtrl', []);

  var MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

  var DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];


  // This first looks at the string value, and if it exists, uses
  // that. Otherwise, it uses the int value.
  function getHabitValue(habitValue) {

  	if (habitValue.valueString)
  		return habitValue.valueString;
  	
  	return habitValue.valueInt;	
  }

  function removeMoodHabit($scope) {

    // Copy the array since we're going to modify it.
    if ($scope.habits)
      $scope.habits = $scope.habits.slice(0);

    // Remove the mood habit.
    for (var i=0; i<$scope.habits.length; ++i) {
      if ($scope.habits[i].name == 'Mood') {
        $scope.habits.splice(i, 1);
        break;
      }
    }
  }

  ctrl.controller('HabitsCtrl', ['$scope', '$state', '$http', '$timeout', '$location', '$stateParams', '$analytics', '$ionicGesture', '$ionicLoading', '$ionicPopup', '$ionicViewService', 'AccountService', 'HabitsService', 'GeneralService',
    function ($scope, $state, $http, $timeout, $location, $stateParams, $analytics, $ionicGesture, $ionicLoading, $ionicPopup, $ionicViewService, AccountService, HabitsService, GeneralService) {

      $scope.date;

      var activeDate = HabitsService.getActiveDate();
      if (activeDate)
        $scope.date = new Date(activeDate);
      else
        $scope.date = new Date();

      $scope.loadingData = false;

      // For removal
      var dragRightGestures = [];
      var dragLeftGestures = [];

      var playOptions;


     	$scope.habits = HabitsService.getAccountHabits();
      $scope.potentialHabits = HabitsService.getPotentialAccountHabits();

      removeMoodHabit($scope);

      var openhabitelment; // To restrict to a single open habit.
   
      var dragFn = function(e) {
        
        if (e.type == 'dragleft') {

          if (openhabitelment)
            angular.element(openhabitelment).addClass("hideRemove");

          var elementScope = angular.element(e.target).scope();
          if (elementScope.habit.name == 'Mood')
            return;

          angular.element(e.target).removeClass("hideRemove");

          openhabitelment = e.target;

          $analytics.eventTrack('openHabitLineItem', {category: 'habits'});
        }
        else if (e.target == openhabitelment) {
          angular.element(e.target).addClass("hideRemove");

          openhabitelment = undefined;

          $analytics.eventTrack('closeHabitLineItem', {category: 'habits'});
        }

        e.gesture.srcEvent.stopPropagation();
        e.gesture.srcEvent.preventDefault();
      };

      // Not initialized yet?
      $timeout(function() {
        var elements = document.getElementsByClassName('dragContainer');
        for (var i=0; i<elements.length; ++i) {
          var localel = elements[i];
          var dragRightGesture = $ionicGesture.on('dragright', dragFn, angular.element(localel));
          var dragLeftGesture = $ionicGesture.on('dragleft', dragFn, angular.element(localel));

          dragRightGestures.push(dragRightGesture);
          dragLeftGestures.push(dragLeftGesture);
        }
      }, 1);

      var hasMedia = false;

      if (window.Media) {
        // If we're native, we are going to play the goal from app.js.
        hasMedia = true;
      }
      else {
        goalAudio = document.getElementById('goalAudio');

        goalAudio.volume = 0.1;
      }

      $scope.$on('event:reachedGoal', function() {
        if (!hasMedia) {
          goalAudio.load();
          goalAudio.play();
        }
      });

      $scope.$on('$destroy', function destroyCtrl() {

        if (!hasMedia) {
          goalAudio.pause();
        }
      });

      $scope.getGoal = function getGoal(habitOrdinal) {
        var habit = $scope.habits[habitOrdinal];
        return HabitsService.getHabitDisplay(habit, habit.goalOrdinal);
      }

    	$scope.getHabitData = function getTodaysHabitData(habitOrdinal) {
    		return HabitsService.getHabitData($scope.date, habitOrdinal);
    	}

      $scope.canAddHabits = function canAddHabits() {
        return $scope.potentialHabits.length > 0;
      }

      $scope.addHabits = function addHabits() {
        if ($scope.canAddHabits())
          $state.go('app.habits-add');
      }

      $scope.showRemove = function showRemove(habitId) {
        return false;
      }

      $scope.removeHabit = function removeHabit(habitId) {
        event.stopPropagation();
        event.preventDefault();

        $analytics.eventTrack('removeHabitPopup', {category: 'habits'});

        var confirmPopup = $ionicPopup.confirm({
          // title: 'Alert',
          template: '<div class="thisisatest">Are you sure you want to remove this daily activity?</div>',
          cancelText: 'CANCEL',
          cancelType: 'button-default',
          okText: 'REMOVE',
          okType: 'button-default'
        });
        confirmPopup.then(function(res) {

           if(res) {

            $ionicLoading.show({
              template: 'Removing Activity...'
            });

            HabitsService.removeHabit(habitId)
              .success(function() {

                HabitsService.removeLocalHabit(habitId);

                // Because we created a copy of the habits array, we need to maually remove the habit.
                for (var i=0; i<$scope.habits.length; ++i) {
                  if($scope.habits[i].id == habitId) {
                    $scope.habits.splice(i, 1);
                    break;
                  }
                }

                $ionicLoading.hide();

                confirmPopup.close();
              })
              .error(function(data, status, headers, config) {
                
                $ionicLoading.hide();

                var alertPopup = $ionicPopup.alert({
                  title: 'Error',
                  template: 'There was an error removing the daily activity. Please try again later.',
                  okText: 'OK, GOT IT.',
                  okType: 'button-default'
                });
              });

            $analytics.eventTrack('removeHabitConfirm', {category: 'habits'});

          } else {
            
            $analytics.eventTrack('removeHabitCancel', {category: 'habits'});
          }
        });
      }

      $scope.getDateString = function getDateString() {

        var dateString = GeneralService.getDayString($scope.date);

        var todayString = GeneralService.getDayString(new Date());
        if (dateString == todayString)
          return 'TODAY';
        else {

          var t = new Date().getTime();
          t -= MILLISECONDS_IN_DAY;
          var yesterday = new Date(t);

          var yesterdayString = GeneralService.getDayString(yesterday);
          if (dateString == yesterdayString) {
            return 'YESTERDAY';
          }
          else {

            var day =  $scope.date.getDay();
            var month = $scope.date.getMonth();

            return DAYS[day] + ", " + MONTHS[month] + ' ' + $scope.date.getDate() + ' ' + $scope.date.getFullYear();
          }
        }
      }

      $scope.previousDay = function previousDay() {

        if (!$scope.canGoBackwards()) return;

        // Subtract a day.
        var t = $scope.date.getTime();
        t -= MILLISECONDS_IN_DAY;

        $scope.date = new Date(t);

        // Need to check to see if that day's data has been requested. If not, go request it.
        var hasHabitData = HabitsService.hasHabitData($scope.date);
        console.log("has data: " + hasHabitData);

        if (!hasHabitData) {

          t -= (MILLISECONDS_IN_DAY * 6);
          var startDate = new Date(t);

          $scope.loadingData = true;

          HabitsService.findHabitData(startDate, $scope.date)
            .success(function(data) {
              $scope.loadingData = false;
              HabitsService.addHabitData(data);
            })
            .error(function(data, status, headers, config) { 

              $scope.loadingData = false;
              // Handle the error
              console.log("habit data error");
            });

          $analytics.eventTrack('previousDay', {category: 'habits'});
        }

        // Don't use location.search, it is buggy on Android.
        HabitsService.setActiveDate($scope.date);
      }

      $scope.nextDay = function nextDay() {
        
        if (!$scope.canGoForward()) return;

        // Add a day.
        var t = $scope.date.getTime();
        t += MILLISECONDS_IN_DAY;

        $scope.date = new Date(t);

        // Don't use location.search, it is buggy on Android.
        HabitsService.setActiveDate($scope.date);

        $analytics.eventTrack('nextDay', {category: 'habits'});
      }

      $scope.canGoBackwards = function canGoBackwards() {

        var accountUser = AccountService.getAccountUser();
        if (!accountUser)
          return false;

        var currentDay = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate());

        var createdAt = new Date(accountUser.user.createdAtStr);
        var createdDay = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());

        return currentDay > createdDay;
      }

      $scope.canGoForward = function canGoForward() {

        var currentDate = new Date();
        var t = currentDate.getTime();

        t -= MILLISECONDS_IN_DAY;
        var yesterday = new Date(t);

        return $scope.date < yesterday;
      }

      $scope.navigateToHabit = function navigateToHabit(state) {

        // We're actually going to allow editing of previous data, as long as it
        // isn't before you signed up.
        // if ($scope.showingTodaysData())

        var data = {};
        if (!$scope.showingTodaysData())
          data.experiencedDate = $scope.date;

        $state.go(state, data);
      }

      $scope.showingTodaysData = function showingTodaysData() {
        var now = new Date();

        var tomorrow = new Date(now.getTime() + MILLISECONDS_IN_DAY);
        var yesterday = new Date(now.getTime() - MILLISECONDS_IN_DAY)

        return $scope.date > yesterday && $scope.date < tomorrow;
      }

      $scope.$on('$destroy', function() {
        for (var gesture in dragLeftGestures) {
          $ionicGesture.off(dragLeftGestures[gesture], 'dragleft', dragFn);  
        }
        
        for (var gesture in dragRightGestures) {
          $ionicGesture.off(dragRightGestures[gesture], 'dragright', dragFn);
        }
      });
    }
  ]);

  ctrl.controller('HabitsTypeCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$analytics', '$stateParams', '$ionicModal', '$ionicNavBarDelegate', 'AccountService', 'HabitsService', 'GeneralService',
  	function ($scope, $rootScope, $state, $timeout, $analytics, $stateParams, $ionicModal, $ionicNavBarDelegate, AccountService, HabitsService, GeneralService) {

  		$scope.submittingData = false;

      // This will be the sub value on the bottom. It has to go here because of the
      // way the scope initialization works.
      $scope.selectedSubValues = [];

      // If we're trying to record habits for previous days, we need the date for it.
      $scope.experiencedDate = $stateParams.experiencedDate ? new Date($stateParams.experiencedDate) : undefined;

      // Load the current data.z
  		$scope.habit = HabitsService.getAccountHabitValues($state.current.data.habit);

      $scope.checkForGoalTest = function checkForGoalTest() {

        return (!$scope.habit.goalMinimized && ($scope.valueData.valueIndex >= $scope.habit.goalOrdinal)) ||
               ($scope.habit.goalMinimized && ($scope.valueData.valueIndex <= $scope.habit.goalOrdinal));
      }

      $scope.closeHabitsGoalModal = function closeHabitsGoalModal() {

        AccountService.setUserPreference('viewed_habit_goal_popup', 'true');
        closeModal($scope.habitsGoalModal);

        $timeout(function() {
          $rootScope.$broadcast('event:reachedGoal');
        }, 500);

        $scope.goBack();      
      }

      $scope.closeSleepGoalModal = function closeSleepGoalModal() {

        AccountService.setUserPreference('viewed_sleep_goal_popup', 'true');
        closeModal($scope.sleepGoalModal);

        $scope.goBack();
      }

      $scope.checkForGoal = function checkForGoal() {

        var reached = $scope.checkForGoalTest();
        var goBack = true;

        if (reached) {
          
          if ($scope.habit.name != 'Mood') {

            var goalPref = AccountService.getUserPreference('viewed_habit_goal_popup');
            if (!goalPref || goalPref == 'false') {

              goBack = false;

              $ionicModal.fromTemplateUrl('views/habits/habits.goalModal.html', {
                  scope: $scope,
                  animation: 'slide-in-up'
                }).then(function(modal) {
                  $scope.habitsGoalModal = modal;

                  openModal($scope.habitsGoalModal);
                });
            }
          }
        
          if (goBack) {
            $timeout(function() {
              $rootScope.$broadcast('event:reachedGoal');
            }, 500);            
          }

          $analytics.eventTrack('reachedHabitGoal', {category: 'habits', label: $scope.habit.name});
        }
        else {

          if ($scope.habit.name == 'Sleep') {

            // When you miss a sleep goal, tell the user about PMR.
            var goalPref = AccountService.getUserPreference('viewed_sleep_goal_popup');
            if (!goalPref || goalPref == 'false') {

              goBack = false;

              $ionicModal.fromTemplateUrl('views/habits/habits.sleepGoalModal.html', {
                  scope: $scope,
                  animation: 'slide-in-up'
                }).then(function(modal) {
                  $scope.sleepGoalModal = modal;

                  openModal($scope.sleepGoalModal);
                });
            }
          }
        }
        
        if (goBack)
          $scope.goBack();
      }

     	$scope.submitData = function submitData() {

        if ($scope.valueData.value == '?') {
          $scope.noDataError = true;
          return;
        }
        else {
          $scope.noDataError = false;
        }

     		$scope.submittingData = true;

        if ($scope.valueData.hasDaysData) {
          HabitsService.updateHabitData($scope.habit, $scope.valueData.valueIndex, undefined, $scope.experiencedDate)
            .success(function() {

              $scope.checkForGoal();
            });

          $analytics.eventTrack('updateHabitData', {category: 'habits', label: $scope.habit.name, value: $scope.valueData.valueIndex});
        }
        else {
      		HabitsService.recordHabitData($scope.habit, $scope.valueData.valueIndex, undefined, $scope.experiencedDate)
      			.success(function() {

              $scope.checkForGoal();
      			});

          $analytics.eventTrack('recordHabitData', {category: 'habits', label: $scope.habit.name, value: $scope.valueData.valueIndex});
        }
    	}

      $scope.goBack = function goBack() {
        history.go(-1);
      }

      // Set the scope variable using the given habit.
      function initializeScope($scope, HabitsService, habit, experiencedDate) {

          var daysDataOrdinal = 0;
          var hasDaysData = false;

          var date = experiencedDate ? experiencedDate : new Date();

          var daysData = HabitsService.getHabitData(date, habit.ordinate);

          // If we have the days data, and there should only be one entry per day,
          // use that data. In addition, if the data was just recorded in the last
          // 5 minutes, we want to allow them to update it.
          if (daysData) {
            if (habit.frequency == 1) {
              
              hasDaysData = true;
            }

            // This was for mood, to make sure we weren't submitting too many data
            // points in a row. We prevent those from happening to every 15 minutes now.
            // else {
            //   // in ms
            //   var date;
            //   if (typeof daysData.data.experiencedAt == 'object')
            //     date = daysData.data.experiencedAt.getTime();
            //   else
            //     date = new Date(daysData.data.experiencedAt).getTime();

            //   var now = new Date().getTime();

            //   if (date > now - (1 * 60 * 1000)) {
            //     hasDaysData = true;
            //   }
            // }
          }

          if (hasDaysData) {
            daysDataOrdinal = daysData.valueOrdinal;

            // Set the selectedSubValue if it is there.
            if (typeof daysData.data.habitSubValueIds !== 'undefined' && habit.habitSubValues) {

              for (var i=0; i<habit.habitSubValues.length; ++i) {

                var subValue = habit.habitSubValues[i];

                for (var j=0; j<daysData.data.habitSubValueIds.length; ++j) {

                  if (subValue.id == daysData.data.habitSubValueIds[j]) {

                    $scope.selectedSubValues.push(subValue);
                    break;
                  }
                }
              }
            }
          }

          $scope.valueData = {
            value: getHabitValue(habit.habitValues[daysDataOrdinal]),
            valueIndex: daysDataOrdinal,
            hasDaysData: hasDaysData
          }

          if (!hasDaysData) {
            $scope.valueData.value = '?';
          }
          else {
            $scope.valueData.userInteracted = true;
          }

          $scope.colors = habit.goalMinimized ? 
            ["#ffffff", "#d04b51"] :  // This is the line for caffeine/alcohol
            ["#d04b51", "#5ce59d"];   // This is the line for most normal habits.

          if (habit.goalMinimized)
            $scope.progressColors = ["#5ce59d", "#d04b51"];

          // This just adds white on to the end of everything.
          if (habit.goalMinimized)
            $scope.colors.push("#d04b51");
          else
            $scope.colors.push('#ffffff');

          if (habit.name == 'Mood')
            $scope.colors[1] = GeneralService.COLORS[$scope.valueData.valueIndex];

          $scope.goalPercentage = habit.goalMinimized ? 
            (habit.goalOrdinal + 1) / habit.habitValues.length :
            habit.goalOrdinal / habit.habitValues.length;

          $scope.colorPercentages = [$scope.goalPercentage, 1- $scope.goalPercentage];
          
      }

    	initializeScope($scope, HabitsService, $scope.habit, $scope.experiencedDate);
  	}

  ]);

  ctrl.controller('HabitsMoodCtrl', ['$scope', '$state', '$stateParams', '$controller', '$timeout', '$analytics', '$ionicModal', 'HabitsService', 'AccountService', 'GeneralService',
    function ($scope, $state, $stateParams, $controller, $timeout, $analytics, $ionicModal, HabitsService, AccountService, GeneralService) {

      // Inherit from the main controller for habits. We're going to extend
      // the functionality there to handle the habit sub values.
      $controller('HabitsTypeCtrl', {$scope: $scope});

      $scope.valueData.redraw = 0;

      // Result to determine which version of the nux modal to display.
      $scope.positive = true;
      $scope.neutral = false;

      $scope.checkForModal = function checkForModal() {

        var openedModal = false;
        
        var pref = AccountService.getUserPreference('viewed_mood_popup');
        if (!pref || pref == 'false') {

          $ionicModal.fromTemplateUrl('views/habits/habits.mood.popup.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            $scope.nuxModal = modal;

            openModal($scope.nuxModal);
          });
          
          openedModal = true;
        }
        
        if (!openedModal) {
          pref = AccountService.getUserPreference('viewed_5xbad_popup');
          if (!pref || pref == 'false') {

            // Check to see if the last 5 mood ratings were bad.
            if (HabitsService.has5BadConsecutiveMoodRatings()) {

              $ionicModal.fromTemplateUrl('views/habits/habits.mood.bad5xpopup.html', {
                scope: $scope,
                animation: 'slide-in-up'
              }).then(function(modal) {
                $scope.bad5xModal = modal;

                openModal($scope.bad5xModal);
              });

              openedModal = true;
            }
          }
        }

        if (!openedModal) {

          pref = AccountService.getUserPreference('viewed_mood_goal_popup');
          if (!pref || pref == 'false') {

            // Mood has to be the first habit, always.
            var data = HabitsService.getHabitDataArray(new Date(), 0);

            // TODO This is wrong. Need to check on just mood.
            if (data && data.length >= 3) {

              $ionicModal.fromTemplateUrl('views/habits/habits.mood.goalModal.html', {
                scope: $scope,
                animation: 'slide-in-up'
              }).then(function(modal) {
                $scope.moodGoalModal = modal;

                openModal($scope.moodGoalModal);
              });

              openedModal = true;
            }
          }
        }

        if (!openedModal) {
          pref = AccountService.getUserPreference('viewed_5xgood_popup');
          if (!pref || pref == 'false') {

            // Check to see if the last 5 mood ratings were bad.
            if (HabitsService.has5GoodConsecutiveMoodRatings()) {

              $ionicModal.fromTemplateUrl('views/habits/habits.mood.good5xpopup.html', {
                scope: $scope,
                animation: 'slide-in-up'
              }).then(function(modal) {
                $scope.good5xModal = modal;

                openModal($scope.good5xModal);
              });

              openedModal = true;
            }
          }
        }
        

        if (!openedModal)
          $scope.checkForGoal();
      }

      $scope.closeMoodGoalModal = function closeMoodGoalModal() {

        AccountService.setUserPreference('viewed_mood_goal_popup', 'true');

        closeModal($scope.moodGoalModal);

        $scope.checkForGoal();
      }

      $scope.closeBad5xModal = function closeBad5xModal() {

        AccountService.setUserPreference('viewed_5xbad_popup', 'true');

        closeModal($scope.bad5xModal);

        $scope.checkForGoal();
      }

      $scope.closeGood5xModal = function closeGood5xModal() {

        AccountService.setUserPreference('viewed_5xgood_popup', 'true');

        closeModal($scope.good5xModal);

        $scope.checkForGoal();
      }

      $scope.closeNuxModal = function closeNuxModal() {

        AccountService.setUserPreference('viewed_mood_popup', 'true');

        closeModal($scope.nuxModal);

        $scope.checkForGoal();
      };

      var lastValueIndex;
      var initialized = false;

      $scope.$watch('valueData.valueIndex', function() {

        // During initialization this value gets updated.
        if (!initialized)
          return;

        var newValueIndex = $scope.valueData.valueIndex;
        if (lastValueIndex != newValueIndex) {

          var redraw = false;

          $scope.neutral = newValueIndex == 3;
          $scope.positive = newValueIndex <= 2;

          // This needs to force a redraw.
          if ($scope.colors[1] != GeneralService.COLORS[newValueIndex])
            redraw = true;

          $scope.colors[1] = GeneralService.COLORS[newValueIndex];

          if (typeof lastValueIndex !== 'undefined') {
            
            // When moving between 'sections' remove the selected value.
            if ( (newValueIndex <= 2 && lastValueIndex > 2) ||
                 (newValueIndex == 3 && lastValueIndex != 3) ||
                 (newValueIndex >= 4 && lastValueIndex < 4) ) {

              $scope.selectedSubValues.length = 0;
            }
          }

          lastValueIndex = newValueIndex;

          // If we changed the colors, we need a redraw.
          if (redraw)
            $scope.valueData.redraw++;
        }
      });

      $timeout(function() {
        initialized = true;
      }, 10);

      $scope.habitSubValues = $scope.habit.habitSubValues;

      $scope.getValueClass = function getValueClass() {
        return 'value' + ($scope.valueData.valueIndex + 1);
      }

      $scope.getInteracted = function getInteracted() {
        return $scope.valueData.userInteracted;
      }

      // this just uses the first sub-value in the "group"
      $scope.showSubValueSection = function showSubValueSection(subValueName) {

        if (!$scope.valueData.userInteracted)
          return false;

        for (var i=0; i<$scope.habitSubValues.length; ++i) {

          var subValue = $scope.habitSubValues[i];

          if (subValue.valueString == subValueName) {

            return $scope.valueData.valueIndex >= subValue.minHabitValueOrdinate &&
                   $scope.valueData.valueIndex <= subValue.maxHabitValueOrdinate;
          }
        }
      }

      $scope.subValueIsActive = function subValueIsActive(subValueName) {

        for (var i=0; i<$scope.selectedSubValues.length; ++i) {
          if ($scope.selectedSubValues[i].valueString == subValueName)
            return true;
        }
        return false;
      }

      $scope.setSelectedSubValue = function setSelectedSubValue(subValueName) {

        for (var i=0; i<$scope.habitSubValues.length; ++i) {

          var subValue = $scope.habitSubValues[i];


          if (subValue.valueString == subValueName) {

            var index = $scope.selectedSubValues.indexOf(subValue);

            if (index >= 0) {

              $scope.selectedSubValues.splice(index, 1);
            }
            else {
              $scope.selectedSubValues.push(subValue);
            }

            break;
          }
        }

        $analytics.eventTrack('toggleHabitSubValue', {category: 'habits', label: subValueName});
      }

      // This is overriding the function in HabitsTypeCtrl
      $scope.submitData = function submitData() {

        if ($scope.valueData.value == '?') {
          $scope.noDataError = true;
          return;
        }
        else {
          $scope.noDataError = false;
        }

        $scope.submittingData = true;

        var subValueIds;
        if ($scope.selectedSubValues.length > 0) {

          subValueIds = [];

          for (var i=0; i<$scope.selectedSubValues.length; ++i) {

            subValueIds.push($scope.selectedSubValues[i].id);
          }
        }

        if ($scope.valueData.hasDaysData) {
          HabitsService.updateHabitData($scope.habit, $scope.valueData.valueIndex, subValueIds, $scope.experiencedDate)
            .success(function() {

              $scope.checkForModal();
            });

          $analytics.eventTrack('updateHabitData', {category: 'habits', label: $scope.habit.name, value: $scope.valueData.valueIndex});
        }
        else {
          HabitsService.recordHabitData($scope.habit, $scope.valueData.valueIndex, subValueIds, $scope.experiencedDate)
            .success(function() {

              $scope.checkForModal();
            });

          $analytics.eventTrack('recordHabitData', {category: 'habits', label: $scope.habit.name, value: $scope.valueData.valueIndex});
        }
      }
    }
  ]);


  ctrl.controller('HabitsMoodHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$controller', 'HabitsService', 'AccountService',
    function ($scope, $rootScope, $state, $stateParams, $controller, HabitsService, AccountService) {
      
      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_mood_intro', 'true');

        // Hack.
        $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

        $state.go('app.habits-Mood', {}, {location: 'replace'});
      }
    }
  ]);

  
  ctrl.controller('HabitsAddCtrl', ['$scope', '$rootScope', '$state', '$analytics', '$ionicLoading', 'HabitsService', 
    function ($scope, $rootScope, $state, $analytics, $ionicLoading, HabitsService) {
      
      $scope.habits = HabitsService.getAccountHabits();
      $scope.potentialHabits = HabitsService.getPotentialAccountHabits();

      $scope.addHabit = function addHabit(habit) {

        $ionicLoading.show({
          template: 'Adding Activity...'
        });

        HabitsService.addHabit(habit.id)
          .success(function() {

            HabitsService.addLocalHabit(habit);

            $ionicLoading.hide();

            // Don't do this. We're going to show the slide for the new habit
            //history.go(-1);

            // But we need to fix ionic and make sure the transitions work correctly.
            $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

            $state.go('app.habits-help', {
              intro: true,
              singleSlide: habit.name
            }, {
              location: 'replace'
            });

          })
          .error(function(data, status, headers, config) {

            var alertPopup = $ionicPopup.alert({
              title: 'Error',
              template: 'There was an error adding the daily habit. Please try again later.',
              okText: 'OK, GOT IT.',
              okType: 'button-default'
            });
          });

        $analytics.eventTrack('addHabit', {category: 'habits', label: habit.name});
      }
    }
  ]);

  ctrl.controller('HabitsHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', 'HabitsService', 'AccountService',
    function ($scope, $rootScope, $state, $stateParams, HabitsService, AccountService) {

      if (window.StatusBar)
        StatusBar.styleDefault();

      $scope.$on('$destroy', function() {
        if (window.StatusBar)
          StatusBar.styleLightContent();
      });

      $scope.intro = false;
      if ($stateParams.intro)
        $scope.intro = $stateParams.intro;

      $scope.singleSlide;
      if ($stateParams.singleSlide)
        $scope.singleSlide = $stateParams.singleSlide;

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_habits_intro', 'true');

        if ($scope.singleSlide)
          history.go(-1);
        else {
          $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

          $state.go('app.habits', {}, {location: 'replace'});
        }
      }

    	$scope.habits = HabitsService.getAccountHabits();  

      removeMoodHabit($scope);

      $scope.showSlide = function showSlide(habitName) {

        if ($scope.singleSlide)
          return habitName == $scope.singleSlide;

        for (var i=0; i<$scope.habits.length; ++i) {
          if ($scope.habits[i].name == habitName)
            return true;
        }

        return false;
      }

      // habitList is a list of names of habits that follow the given one. We 
      // need to see if any of them has a higher index than the one with habitName.
      $scope.isLast = function isLast(habitName, habitList) {

        if ($scope.singleSlide)
          return habitName == $scope.singleSlide;

        // For all habits, see if it is in the remaining list.
        for (var k=0; k<$scope.habits.length; ++k) {

          if (habitList.indexOf($scope.habits[k].name) >= 0)
            return false;
        }

        return true;
      }
    }
  ]);

  ctrl.controller('HabitsConfigCtrl', ['$scope', '$timeout', '$analytics', 'HabitsService',
    function ($scope, $timeout, $analytics, HabitsService) {

      // Show the keyboard.
      if (window.Keyboard && window.Keyboard.hideFormAccessoryBar)
        Keyboard.hideFormAccessoryBar(false);

      $scope.goalUpdated = false;

      // Make a copy because we're going to modify it.
      $scope.habits = HabitsService.getAccountHabits().slice(); 

      $scope.goBack = function goBack() {
        history.go(-1);
      }

      $scope.getGoalDisplay = function getGoalDisplay(habitValue) {

        if (habitValue.valueString)
          return habitValue.display;
        else
          return habitValue.valueInt + ' ' + habitValue.display;
      }

      $scope.getHabitValues = function getHabitValues(habit) {
        var habitValues = habit.habitValues.slice();

        if (habit.name == 'Sleep') {
          habitValues = habitValues.slice(2);
        }
        else if (habit.name == 'Exercise' || habit.name == 'Eating' || habit.name == 'Water' || habit.name == 'Outdoors') {
          habitValues = habitValues.slice(1);
        }
        else if (habit.name == 'Alcohol' || habit.name == 'Caffeine') {
          habitValues = habitValues.slice(0, habitValues.length-2);
        }

        return habitValues;
      }

      $scope.updateGoal = function updateGoal(habit) {

        HabitsService.updateGoalOrdinal(habit)
          .success(
            function() {
              $scope.goalUpdated = true;

              $timeout(function() {
                $scope.goalUpdated = false;
              }, 3000);
            }
          );

        $analytics.eventTrack('updateHabitGoal', {category: 'habits', label: habit.name, value: habit.goalOrdinal});
      }
    }
  ]);

})();