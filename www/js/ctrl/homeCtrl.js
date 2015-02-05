(function() {

	var ctrl = angular.module('homeCtrl', []);

	// Not sure if all this is necessary, but we want to listen for resume events
	// when the app is activated. This should let us kick off a digest cycle
	// so that things get re-rendered.
	var currentListener = undefined;
	var initializedResumeListener = false;

	function resumeListener() {

		if (currentListener)
			currentListener();
	}

	function initResumeListener(newListener ) {

		if (!initializedResumeListener) {

			initializedResumeListener = true;

			document.addEventListener('resume', resumeListener);
		}

		currentListener = newListener;
	}

	function removeResumeListener() {

		currentListener = undefined;
	}

	
	ctrl.controller('HomeCtrl', ['$scope', '$state', '$http', '$analytics', '$ionicModal', '$ionicPopup', '$ionicViewService', 'HabitsService', 'AccountService', 'GoalService', 'PayService', 'GeneralService',
	  function ($scope, $state, $http, $analytics, $ionicModal, $ionicPopup, $ionicViewService, HabitsService, AccountService, GoalService, PayService, GeneralService) {

	  	$scope.resumeListener = function() {

	  		// check digest
	  		console.log("home ctrl got resume");
	  		if (!$scope.$$phase)
	  			$scope.$apply();
	  	}

	  	initResumeListener($scope.resumeListener);

		  $scope.$on('$destroy', function() {
        removeResumeListener();
      });

	  	// Clear any history when you get back to home. This prevents the issue with the
	  	// Android back button wanting to go back into an activity.
	  	$ionicViewService.clearHistory()

	  	// Clear the active date in the habits view stack. Always re-enter at today.
	  	HabitsService.setActiveDate(undefined);

	  	if (window.StatusBar)
        StatusBar.styleLightContent();

	    function showRelaxPopup() {
	    	$ionicPopup.alert({
          title: '',
          template: '<div>You must first complete <strong>MOOD</strong> to unlock this tool.</div>',
          okText: 'OK, GOT IT.',
          okType: 'button-default'
        });
	    }

     //  function showRethinkPopup() {
     //  	$ionicPopup.alert({
     //      title: '',
     //      template: '<div>You must first complete <strong>RELAX</strong> to unlock this tool.</div>',
     //      okText: 'OK, GOT IT.',
     //      okType: 'button-default'
     //    });
     //  }

	    // function showGoalsHabitsPopup() {
	    // 	$ionicPopup.alert({
     //      title: '',
     //      template: '<div>You must first complete <strong>THOUGHTS</strong> to unlock this tool.</div>',
     //      okText: 'OK, GOT IT.',
     //      okType: 'button-default'
     //    });
	    // }

	    $scope.showPremiumModal = function showPremiumModal(label) {

	    	PayService.showPremiumModal($scope, 'home', label, true);
      }

	    $scope.isProgressEnabled = function isProgressEnabled() {

	    	return AccountService.isProgressEnabled();
	    }

	    $scope.isPremiumEnabled = function isPremiumEnabled() {

	    	return AccountService.isPremiumEnabled();
	    }

	    $scope.goToProgress = function goToProgress() {

	    	if (!$scope.isProgressEnabled()) {

	    		$ionicPopup.alert({
	          title: '',
	          template: '<div>Progress will be available after day three.</div>',
	          okText: 'OK, GOT IT.',
	          okType: 'button-default'
	        });
	    	}
	    	else {
	    		$state.go('app.progress');
	    	}
	    }

		  $scope.goToMood = function goToMood() {

		  	if (HabitsService.canSubmitMood()) {

			    // Check to see if we need to display the help slides the first time.
			    var pref = AccountService.getUserPreference('completed_mood_intro');
			    if (!pref || pref != 'true') {

			      $state.go('app.habits-Mood-help', {intro: true});
			    }
			    else {
			      $state.go('app.habits-Mood');
			    }
			  }
			  else {

			  	$ionicPopup.alert({
	          title: '',
	          template: '<div><strong>Mood</strong> can only be submitted every 15 minutes. Please check back in soon.</div>',
	          okText: 'OK, GOT IT.',
	          okType: 'button-default'
	        });
			  }
		  }

		  $scope.goToHabits = function goToHabits() {

		  	if (!$scope.isHabitsEnabled()) {
		  		showRelaxPopup();
		  		return;
		  	}

		    // Check to see if we need to display the help slides the first time.
		    var pref = AccountService.getUserPreference('completed_habits_intro');
		    if (!pref || pref != 'true') {

		      $state.go('app.habits-help', {intro: true});
		    }
		    else {
		      $state.go('app.habits');
		    }
		  }

		  $scope.goToRelax = function goToRelax() {
		  	if (!$scope.isRelaxEnabled()) {
		  		showRelaxPopup();
		  		return;
		  	}

		  	if (AccountService.isPremiumEnabled() || $scope.isRelaxActive()) {
			    // Check to see if we need to display the help slides the first time.
			    var pref = AccountService.getUserPreference('completed_relax_intro');
			    if (!pref || pref != 'true') {

			      $state.go('app.relax-help', {intro: true});
			    }
			    else {
			      $state.go('app.relax');
			    }
			  }
			  else {
			  	$scope.showPremiumModal('relax');
			  }
		  }

		  $scope.goToRethink = function goToRethink() {

		  	if (!$scope.isRethinkEnabled()) {
		  		showRelaxPopup();
		  		return;
		  	}

		  	if (AccountService.isPremiumEnabled() || $scope.isRethinkActive()) {

			    // Check to see if we need to display the help slides the first time.
			    var pref = AccountService.getUserPreference('completed_rethink_intro');
			    if (!pref || pref != 'true') {

			      $state.go('app.rethink-help', {intro: true});
			    }
			    else {
			      $state.go('app.rethink-list');
			    }
			  }
			  else {
			  	$scope.showPremiumModal('thoughts');
			  }
		  }

		  $scope.goToGoals = function goToGoals() {

		  	if (!$scope.isGoalsEnabled()) {
		  		showRelaxPopup();
		  		return;
		  	}

		  	if (AccountService.isPremiumEnabled() || $scope.isGoalsActive()) {

			    // Check to see if we need to display the help slides the first time.
			    var pref = AccountService.getUserPreference('completed_goals_intro');
			    if (!pref || pref != 'true') {

			      $state.go('app.goals-help', {intro: true});
			    }
			    else {
			      $state.go('app.goals');
			    }
			  }
			  else {
			  	$scope.showPremiumModal('goals');
			  }
		  }

		  $scope.isRelaxEnabled = function isRelaxEnabled() {

		  	var pref = AccountService.getUserPreference('viewed_mood_popup');
        return pref;
		  }

		  $scope.isRelaxActive = function isRelaxActive() {

		  	return AccountService.isRelaxActive();
		  }

		  $scope.isRethinkEnabled = function isRethinkEnabled() {

		  	return $scope.isRelaxEnabled();
		  }

		  $scope.isRethinkActive = function isRethinkActive() {

		  	return AccountService.isRethinkActive();
		  }

		  $scope.isHabitsEnabled = function isHabitsEnabled() {

		  	return $scope.isRelaxEnabled();
		  }

		  $scope.isGoalsEnabled = function isGoalsEnabled() {

		  	return $scope.isRethinkEnabled();
		  }

		  $scope.isGoalsActive = function isGoalsActive() {

		  	return AccountService.isGoalsActive();
		  }

		  $scope.getTodaysMoodCount = function getTodaysMoodCount() {

		    // Mood has to be the first habit, always.
		    var data = HabitsService.getHabitDataArray(new Date(), 0);

		   	if (data)
		   		return data.length;

		   	return 0;
		  }

		  $scope.hitMoodGoal = function hitMoodGoal() {
		  	return $scope.getTodaysMoodCount() >= 1;
		  }

		  $scope.hitRelaxGoal = function hitBreatheGoal() {
		  	return $scope.getRelaxActivityCount() >= 1;
		  }

		  $scope.getRelaxActivityCount = function getRelaxActivityCount() {

		  	return $scope.getBreatheActivityCount() +
		  				 $scope.getMuscleActivityCount();
		  }

		  $scope.getBreatheActivityCount = function getBreatheActivityCount() {

		  	return AccountService.getActivityCount('COMPLETED_BREATHING');
		  }

		  $scope.getMuscleActivityCount = function getMuscleActivityCount() {

		  	return AccountService.getActivityCount('COMPLETED_MUSCLE_RELAXATION');
		  }

		  $scope.getRethinkActivityCount = function getRethinkActivityCount() {

		  	return AccountService.getActivityCount('COMPLETED_RETHINK');	
		  }

		  $scope.hitRethinkGoal = function hitRethinkGoal() {

		  	return $scope.getRethinkActivityCount() >= 1;
		  }

		  $scope.getGoalsActivityCount = function getGoalsActivityCount() {

		  	return GoalService.getAchievedSubGoals();
		  }

		  $scope.hitGoalsGoal = function hitGoalsGoal() {

		  	return $scope.getGoalsActivityCount() >= 1;
		  }

		  $scope.getHabitCount = function getHabitCount() {

		  	var habits = HabitsService.getAccountHabits();

		  	// Mood does not count.
		  	return habits.length - 1;
		  }

		  $scope.getCompletedHabits = function getCompletedHabits() {

		  	var habits = HabitsService.getAccountHabits();

		  	var today = new Date();

		  	var completed = 0;
		  	for (var i=0; i<habits.length; ++i) { // Note that we're starting 

		  		var habit = habits[i];
		  		if (habit.name == 'Mood')
		  			continue;

		  		var todaysData = HabitsService.getHabitData(today, habit.ordinate);

		  		if (todaysData)
		  			++completed;
		  	}

		  	return completed;
		  }

		  $scope.hitHabitsGoal = function hitHabitGoal() {

		  	return $scope.getCompletedHabits() >= $scope.getHabitCount();	
		  }
	  }
	]);

})();