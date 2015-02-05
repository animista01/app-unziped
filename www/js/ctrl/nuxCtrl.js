(function() {

    var ctrl = angular.module('nuxCtrl', []);

    function initializeScopeValues($scope) {

    	$scope.values = [
    	  {
    	  	display: "Not at all",
    	  	ordinate: 0,
    	  	valueInt: 0,
    	  	valueString: "Not at all",
    	  },
    	  {
    	  	display: "Several days",
    	  	ordinate: 1,
    	  	valueInt: 1,
    	  	valueString: "Several days"
    	  },
    	  {
    	  	display: "More than half the days",
    	  	ordinate: 2,
    	  	valueInt: 2,
    	  	valueString: "More than half the days"
    	  },
    	  {
    	  	display: "Nearly every day",
    	  	ordinate: 3,
    	  	valueInt: 3,
    	  	valueString: "Nearly every day"
    	  }
    	];

    	$scope.colors = ["#5ce59d", "#5ce59d", "#969696"];
    	$scope.colorPercentages = [0, 1];
    	$scope.goalPercentage = 0;

    	$scope.valueData = {
    		percentage: 0,
    		valueIndex: 0,
    		value: 0
    	}
    }

    ctrl.controller('NuxCtrl', ['$scope', '$http', '$state', 'AccountService',
      function ($scope, $http, $state, AccountService) {

        if (window.StatusBar)
          StatusBar.styleDefault();

        $scope.user = AccountService.getAccountUser();

        // There's a strange problem where, after signing up, the keyboard stays there. Try to fix it.
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard)
        	window.cordova.plugins.Keyboard.close();

        $scope.next = function next() {

            // We're removing the GAD-2 exercise for now.
        	// AccountService.setUserPreference('last_nux_state', 'app.nux-anxious');
        	// $state.go('app.nux-anxious');

            AccountService.setUserPreference('last_nux_state', 'app.nux-goal');
            
            $state.go('app.nux-goal');
        }
      }
    ]);

    ctrl.controller('NuxAnxiousCtrl', ['$scope', '$http', '$state', 'AccountService',
      function ($scope, $http, $state, AccountService) {

        if (window.StatusBar)
          StatusBar.styleDefault();

        $scope.next = function next() {

        	AccountService.setUserPreference('anxious_days', $scope.valueData.valueIndex);
        	AccountService.setUserPreference('last_nux_state', 'app.nux-worry');

        	$state.go('app.nux-worry');
        }

        initializeScopeValues($scope);
      }
    ]);

    ctrl.controller('NuxWorryCtrl', ['$scope', '$http', '$state', 'AccountService',
      function ($scope, $http, $state, AccountService) {

        if (window.StatusBar)
          StatusBar.styleDefault();

        $scope.next = function next() {

        	AccountService.setUserPreference('worrying_days', $scope.valueData.valueIndex);
        	AccountService.setUserPreference('last_nux_state', 'app.nux-anxiety');

        	$state.go('app.nux-anxiety');
        }

        initializeScopeValues($scope);
      }
    ]);

    ctrl.controller('NuxAnxietyCtrl', ['$scope', '$http', '$state', 'AccountService',
      function ($scope, $http, $state, AccountService) {

        if (window.StatusBar)
          StatusBar.styleDefault();

        $scope.next = function next() {

        	AccountService.setUserPreference('last_nux_state', 'app.nux-goal');

        	$state.go('app.nux-goal');
        }


        $scope.getAnxietyDisplay = function getAnxietyDisplay() {
        	var anxious_days = AccountService.getUserPreference('anxious_days');
        	var worrying_days = AccountService.getUserPreference('worrying_days');

        	var anxious_val = typeof anxious_days == 'string' ? +anxious_days : anxious_days;
        	var worrying_val = typeof worrying_days == 'string' ? +worrying_days : worrying_days;

        	var anxiety;
        	var total = anxious_val + worrying_val;
        	if (total <= 2) {
        		anxiety = 'Mild';
        	}
        	else if (total <= 4) {
        		anxiety = 'Moderate';
        	}
        	else {
        		anxiety = 'Severe';
        	}

        	return anxiety;
        }
      }
    ]);

    ctrl.controller('NuxGoalCtrl', ['$scope', '$http', '$state', 'AccountService', 'HabitsService', 'GoalService', 'GeneralService',
      function ($scope, $http, $state, AccountService, HabitsService, GoalService, GeneralService) {

        if (window.StatusBar)
            StatusBar.styleDefault();

		$scope.goal;
		$scope.error = false;

        $scope.setGoal = function setGoal(goal) {
        	$scope.goal = goal;
        	$scope.error = false;
        }

        $scope.getGoal = function getGoal() {
        	return $scope.goal;
        }

        $scope.chooseGoal = function chooseGoal() {

        	if (!$scope.goal) {
        		$scope.error = true;
        		return;
        	}

        	AccountService.setUserPreference('user_goal', $scope.goal);

            var color = GeneralService.COLOR_NAMES[0];

        	if ($scope.goal == 'gad') {
                GoalService.addGoal('I want to feel less anxiety throughout the day', color);

        		// No special activity.
        	} else if ($scope.goal == 'social') {
                GoalService.addGoal('I want to feel less anxiety in social situations', color);

        		HabitsService.addLocalHabitFromId(HabitsService.OUTDOORS_HABIT_ID);
        		HabitsService.addHabit(HabitsService.OUTDOORS_HABIT_ID);
        	} else if ($scope.goal == 'panic') {
                GoalService.addGoal('I want to reduce my anxiety attacks', color);

        		HabitsService.addLocalHabitFromId(HabitsService.CAFFEINE_HABIT_ID);
        		HabitsService.addHabit(HabitsService.CAFFEINE_HABIT_ID);
        	}

        	console.log("anxious_days: " + AccountService.getUserPreference('anxious_days'));
        	console.log("worrying_days: " + AccountService.getUserPreference('worrying_days'));
        	console.log("user_goal: " +  AccountService.getUserPreference('user_goal'));

    		AccountService.setUserPreference('last_nux_state', 'app.nux-activities');            

        	$state.go("app.nux-activities");
        }
      }
    ]);


    ctrl.controller('NuxActivitiesCtrl', ['$scope', '$http', '$state', 'AccountService',
      function ($scope, $http, $state, AccountService) {

        if (window.StatusBar)
            StatusBar.styleDefault();

        $scope.next = function next() {

            AccountService.setUserPreference('last_nux_state', 'completed');

        	$state.go("app.home");
        }
      }
    ]);

})();