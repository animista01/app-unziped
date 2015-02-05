var ctrl = angular.module('goalsCtrl', []);

ctrl.controller('GoalsCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$timeout', '$location', '$analytics', '$ionicModal', '$ionicPopup', '$ionicGesture', '$ionicViewService', '$ionicScrollDelegate', 'Environment', 'AccountService', 'GoalService', 'GeneralService',
  function ($scope, $rootScope, $state, $stateParams, $timeout, $location, $analytics, $ionicModal, $ionicPopup, $ionicGesture, $ionicViewService, $ionicScrollDelegate, Environment, AccountService, GoalService, GeneralService) {

    var currentDay = GeneralService.getDayString(new Date());

    // An array of goal IDs.
    $scope.expandedGoals = [];

    // daily or longTerm
    $scope.activeTab = 'daily';

    // Don't use stateParams and location.search. It's buggy on Android.
    var lastActiveTab = GoalService.getLastActiveTab();
    if (lastActiveTab)
      $scope.activeTab = lastActiveTab;

    // For removal
    var dragLeftGestures = [];
    var dragRightGestures = [];

    function removeDragGestures() {

      for (var gesture in dragLeftGestures) {
        $ionicGesture.off(dragLeftGestures[gesture], 'dragleft', elementDragged);  
      }
      
      for (var gesture in dragRightGestures) {
        $ionicGesture.off(dragRightGestures[gesture], 'dragright', elementDragged);
      }
    }

    $scope.$on('$destroy', function() {

      removeDragGestures();
    });

    $scope.achievedSubGoal = function achievedSubGoal(subGoal) {

      return GoalService.achievedSubGoal(subGoal);
    }

    var openGoalElement;
    var openSubGoalElement;

    function elementDragged(e) {

      if (e.type == 'dragleft') {

        if (openGoalElement)
          angular.element(openGoalElement).addClass("hideRemove");
        if (openSubGoalElement)
          angular.element(openSubGoalElement).addClass("hideRemove");

        var elementScope = angular.element(e.target).scope();
        if (elementScope.subGoal) {

          openSubGoalElement = e.target;
        }
        else{

          openGoalElement = e.target;
        }

        angular.element(e.target).removeClass("hideRemove");
      }
      else {

        angular.element(e.target).addClass("hideRemove");

        openGoalElement = undefined;
        openSubGoalElement = undefined;
      }
    }
    var quote_index = Math.floor(Math.random() * 9);
    $scope.getQuote = function getQuote(){
      var quotes = ['The journey of a thousand miles begins with one step.',
      'If you don\'t know where you are going, you might wind up someplace else.',
      'Step by step and the thing is done.',
      'Always do what you are afraid to do.',
      'Ultimately we know deeply that the other side of every fear is freedom.',
      'There are very few monsters who warrant the fear we have of them.',
      'A goal properly set is halfway reached.',
      'Whoever wants to reach a distant goal must take small steps.',
      'Arriving at one goal is the starting point to another.']
      return quotes[quote_index];
    }
    $scope.getAuthor = function getAuthor(){
      var authors = ['Lao Tzu', 'Yogi Berra', 'Charles Atlas', 'Ralph Waldo Emerson', 'Marilyn Ferguson', 'Andre Gide', 'Zig Ziglar', 'Saul Bellow', 'John Dewey'];
      return authors[quote_index];
    }

    $scope.getAchievedGoalDifficulty = function getAchievedGoalDifficulty(goal) {

      var difficulty = 0;

      for (var key in $scope.subGoals) {

        var daySubGoals = $scope.subGoals[key];

        for (var i=0; i<daySubGoals.length; ++i) {

          var subGoal = daySubGoals[i];
          if (subGoal.goalId == goal.id && $scope.achievedSubGoal(subGoal)) {

            difficulty += subGoal.difficulty;
          }
        }
      }

      return difficulty;
    }

    function updateGoals() {
      
      $scope.goals = GoalService.getAccountGoals();
      if ($scope.goals)
        $scope.goals = $scope.goals.slice();
      else
        $scope.goals = [];

      $scope.subGoals = GoalService.getAccountSubGoals();
      
      $scope.daysSubGoals = $scope.subGoals[currentDay] ? $scope.subGoals[currentDay].slice() : [];

      // Sort the account goals, by points.
      $scope.goals.sort(function(a,b) {

        return $scope.getAchievedGoalDifficulty(b) - $scope.getAchievedGoalDifficulty(a);

      });

      // Sort the daily goals, first by accomplished and then by points.
      $scope.daysSubGoals.sort(function(a,b) {

        if ($scope.achievedSubGoal(a) && !$scope.achievedSubGoal(b)) {
          return -1;
        }
        else if (!$scope.achievedSubGoal(a) && $scope.achievedSubGoal(b)) {
          return 1;
        }
        else {
          return b.difficulty - a.difficulty;
        }
      });

      // Elements not initialized yet.
      $timeout(function() {
        var elements = document.getElementsByClassName('dragContainer');
        for (var i=0; i<elements.length; ++i) {
          var localel = elements[i];
          var dragRightGesture = $ionicGesture.on('dragright', elementDragged, angular.element(localel));
          var dragLeftGesture = $ionicGesture.on('dragleft', elementDragged, angular.element(localel));

          dragRightGestures.push(dragRightGesture);
          dragLeftGestures.push(dragLeftGesture);
        }
      }, 1);
    }

    // Update the initial values for the goals
    updateGoals();

    $scope.setActiveTab = function setActiveTab(tab) {

      if (tab != $scope.activeTab) {
        $scope.activeTab = tab;

        $scope.expandedGoals.length = 0;

        GoalService.setLastActiveTab($scope.activeTab);

        // redraw height
        $ionicScrollDelegate.resize();
      }
    }

    $scope.getGoalColorClass = function getGoalColorClass(goal) {

      if (!goal.color)
        return GeneralService.COLOR_NAMES[0];

      return goal.color;
    }

    $scope.getSubGoalColorClass = function getSubGoalColorClass(subGoal) {

      for (var i=0; i<$scope.goals.length; ++i) {

        var goal = $scope.goals[i];

        if (goal.id == subGoal.goalId) {

          return goal.color;
        }
      }
    }

		$scope.addGoal = function addGoal() {
		
			$state.go('app.goals-addgoal');	
		}

    $scope.editGoal = function editGoal(goal) {

      $state.go('app.goals-addgoal', {
        goalId: goal.id
      })
    }

    $scope.archiveGoal = function archiveGoal(goal) {

      if (!Environment.isOnline()) {

        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'At the moment, experiments may only be archived when you are online. Please try again later.',
            okText: 'OK, GOT IT.',
            okType: 'button-default'
          });

        return;
      }

      $analytics.eventTrack('archiveGoalPopup', {category: 'goals'});

      var confirmPopup = $ionicPopup.confirm({
        // title: 'Alert',
        template: '<div class="thisisatest">Are you sure you want to remove this goal and its corresponding experiments?</div>',
        cancelText: 'CANCEL',
        cancelType: 'button-default',
        okText: 'REMOVE',
        okType: 'button-default'
      });
      confirmPopup.then(function(res) {

         
         if(res) {

          GoalService.archiveGoal(goal.id)
            .success(function() {
              confirmPopup.close();

              updateGoals();
            });

          $analytics.eventTrack('archiveGoalConfirm', {category: 'goals'});

        } else {
          
          $analytics.eventTrack('archiveGoalCancel', {category: 'goals'});
        }
      });
    }

		$scope.addSubGoal = function addSubGoal() {

			$state.go('app.goals-addsubgoal');
		}

    $scope.editSubGoal = function editSubGoal(subGoal) {

      event.preventDefault();
      event.stopPropagation();

      $state.go('app.goals-addsubgoal', {
        subGoalId: subGoal.id
      });
    }

    $scope.closeAchieveSubGoalModal = function closeAchieveSubGoalModal() {

      AccountService.setUserPreference('view_complete_experiment_popup', true);
      
      closeModal($scope.achieveSubGoalModal);

      $timeout(function() {
        $rootScope.$broadcast('event:reachedGoal');
      }, 500);
    }

    $scope.closeFirstStarModal = function closeFirstStarModal() {

      AccountService.setUserPreference('view_experiment_star_popup', true);
      
      closeModal($scope.firstStarModal);

      $timeout(function() {
        $rootScope.$broadcast('event:reachedGoal');
      }, 500);
    }

    function checkForAchievedPopup(subGoal) {

      var pref = AccountService.getUserPreference('view_complete_experiment_popup');
      if (!pref || pref == 'false') {

        $ionicModal.fromTemplateUrl('views/goals/goals.achieveSubGoalModal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.achieveSubGoalModal = modal;

          openModal($scope.achieveSubGoalModal);
        });
      }
      else {

        pref = AccountService.getUserPreference('view_experiment_star_popup');
        if (!pref || pref == 'false') {

          var goal = GoalService.getGoal(subGoal.goalId);
          var goalClass = $scope.getAchievedGoalClass(goal);

          if (goalClass != 'none') {
            $ionicModal.fromTemplateUrl('views/goals/goals.firstStarModal.html', {
              scope: $scope,
              animation: 'slide-in-up'
            }).then(function(modal) {
              $scope.firstStarModal = modal;

              openModal($scope.firstStarModal);
            });
          }
        }
        else {
          $timeout(function() {
            $rootScope.$broadcast('event:reachedGoal');
          }, 500);
        }
      }
    }

		$scope.achieveSubGoal = function achieveSubGoal(subGoal) {

			if ($scope.achievedSubGoal(subGoal)) {

        var alertPopup = $ionicPopup.alert({
          title: 'Goal Achieved',
          template: '<div class="thisisatest">This experiment was already completed.</div>',
          okText: 'OK, GOT IT.',
          okType: 'button-default'
        });
				return;
      }

      $analytics.eventTrack('achieveSubGoalPopup', {category: 'goals'});

			var confirmPopup = $ionicPopup.confirm({
  	    // title: 'Alert',
  	    template: '<div class="thisisatest">Congrats! You completed your experiment?</div>',
  	    cancelText: 'CANCEL',
        cancelType: 'button-default',
  	    okText: 'CONFIRM',
        okType: 'button-default'
  	  });
  	  confirmPopup.then(function(res) {

  	    if(res) {

  	     	GoalService.achieveSubGoal(currentDay, subGoal.id)
  	     		.success(function() {
  	     			confirmPopup.close();

              updateGoals();

              checkForAchievedPopup(subGoal);
  	     		});

          $analytics.eventTrack('achieveSubGoalConfirm', {category: 'goals'});

  	    } else {

  	      $analytics.eventTrack('achieveSubGoalCancel', {category: 'goals'});
  	    }
  	  });
		}

    $scope.archiveSubGoal = function archiveGoal(subGoal) {

      event.preventDefault();
      event.stopPropagation();

      if (!Environment.isOnline()) {

        var alertPopup = $ionicPopup.alert({
            title: 'Error',
            template: 'At the moment, experiments may only be archived when you are online. Please try again later.',
            okText: 'OK, GOT IT.',
            okType: 'button-default'
          });

        return;
      }

      $analytics.eventTrack('archiveSubGoalPopup', {category: 'goals'});

      var confirmPopup = $ionicPopup.confirm({
        // title: 'Alert',
        template: '<div class="thisisatest">Are you sure you want to remove this experiment?</div>',
        cancelText: 'CANCEL',
        cancelType: 'button-default',
        okText: 'REMOVE',
        okType: 'button-default'
      });
      confirmPopup.then(function(res) {

         
         if(res) {

          GoalService.archiveSubGoal(currentDay, subGoal.id)
            .success(function() {
              confirmPopup.close();

              updateGoals();
            });

          $analytics.eventTrack('archiveSubGoalConfirm', {category: 'goals'});

        } else {
          
          $analytics.eventTrack('archiveSubGoalCancel', {category: 'goals'});
        }
      });
    }

    $scope.getPrintableDate = function getPrintableDate(subGoal) {

      var date = new Date(subGoal.achievedRecordedAtString);

      return GeneralService.getDateDisplay(date) + ' at ' + GeneralService.getMinuteDisplay(date);
    }

    // Don't change these without checking on the star popup, it uses them.
    $scope.getAchievedGoalClass = function getAchievedGoalClass(goal) {

      var difficulty = $scope.getAchievedGoalDifficulty(goal);
      if (difficulty >= 100)
        return "gold";
      else if (difficulty >= 50)
        return "silver";
      else if (difficulty >= 20)
        return "bronze"

      return "none";
    }

    $scope.expandGoal = function expandGoal(goal) {

      var index = $scope.expandedGoals.indexOf(goal.id);
      if (index >= 0) {

        $scope.expandedGoals.splice(index, 1);
      }
      else {
        // Clear the others first.
        $scope.expandedGoals.length = 0;

        $scope.expandedGoals.push(goal.id);
      }
      // redraw height
      $ionicScrollDelegate.resize();
      $analytics.eventTrack('toggleExpandGoal', {category: 'goals'});
    }

    $scope.isGoalExpanded = function isGoalExpanded(goal) {

      return $scope.expandedGoals.indexOf(goal.id) >= 0;
    }

    $scope.getAchievedSubGoals = function getAchievedSubGoals(goal) {

      var subGoals = [];

      if ($scope.isGoalExpanded(goal)) {

        for (var day in $scope.subGoals) {

          var daySubGoals = $scope.subGoals[day];
          for (var i=0; i<daySubGoals.length; ++i) {

            var subGoal = daySubGoals[i];
            if (subGoal.goalId == goal.id && $scope.achievedSubGoal(subGoal)) {
              subGoals.push(subGoal);
            }
          }
        }
      }

      // Sort the goals by their day.
      if (subGoals.length > 0) {

        subGoals.sort(function (a,b) {

          var aDate = new Date(a.day);
          var bDate = new Date(b.day);

          if (aDate < bDate)
            return 1;
          else if (aDate > bDate)
            return -1;
          else
            return 0;

        });
      }
     
      return subGoals;
    }
  }
]);

ctrl.controller('GoalsAddGoalCtrl', ['$scope', '$state', '$stateParams', '$http', '$analytics', '$ionicPopup', '$ionicLoading', 'AccountService', 'GoalService', 'GeneralService',
  function ($scope, $state, $stateParams, $http, $analytics, $ionicPopup, $ionicLoading, AccountService, GoalService, GeneralService) {

    if (window.StatusBar)
      StatusBar.styleDefault();

    $scope.$on('$destroy', function() {
      if (window.StatusBar)
        StatusBar.styleLightContent();
    });
    
    $scope.displayColorOptions = true;
    $scope.nux = $stateParams.nux ? $stateParams.nux : false;
    if ($stateParams.nux)
      $scope.displayColorOptions = false;

    $scope.nextState;
    if ($stateParams.nextState)
      $scope.nextState = $stateParams.nextState;

    $scope.viewData = {
      goal: '',
      error: false,
      submitting: false
    }

    $scope.colorOptions = {
      colors: GeneralService.COLOR_NAMES,
      colorOptionOrdinal: 0
    }

    $scope.editing = false;
    if ($stateParams.goalId) {

      var goalId = isNumeric($stateParams.goalId) ? +$stateParams.goalId : $stateParams.goalId;
      var goal = GoalService.getGoal(goalId);

      if (goal) {
        $scope.viewData.goal = goal.title;
        $scope.viewData.goalId = goal.id;

        if (!goal.color)
          goal.color = GeneralService.COLOR_NAMES[0];

        $scope.colorOptions.colorOptionOrdinal = $scope.colorOptions.colors.indexOf(goal.color);

        $scope.editing = true;
      }
    }

    // Cycle through the colors if we aren't editing anything.
    if (!$scope.editing) {

      for (var i=0; i<$scope.colorOptions.colors.length; ++i) {

        var currentColor = $scope.colorOptions.colors[i];

        var found = false;

        var currentGoals = GoalService.accountGoals;
        for (var j=0; j<currentGoals.length; ++j) {

          if (currentGoals[j].color == currentColor) {
            found = true;
            break;
          }
        }

        if (!found) {

          $scope.colorOptions.colorOptionOrdinal = $scope.colorOptions.colors.indexOf(currentColor);
          break;
        }
      }
    }

    $scope.getColorOptionDisplay = function getColorOptionDisplay(item) {
      return GeneralService.toTitleCase(item);
    }

    // Update the goal option with the ordinal that has been set.
    $scope.updateColorOption = function updateColorOption() {

      $scope.viewData.color = $scope.colorOptions.colors[$scope.colorOptions.colorOptionOrdinal];

      $analytics.eventTrack('setGoalColor', {category: 'goals'});
    }

    $scope.getColorClass = function getColorClass() {

      return $scope.viewData.color;
    }

    // Make sure the color gets initialized.
    if (!$scope.viewData.color)
      $scope.updateColorOption();

    $scope.setPredefinedGoal = function setPredefinedGoal(name) {

      if (name == "Other" ) {
        name = "..";
      }

    	$scope.viewData.goal = 'I want to reduce my ' + name + '.';

      $analytics.eventTrack('setPredefinedGoal', {category: 'goals', label: name});
    }

    $scope.closeKeyboard = function closeKeyboard() {
      if (window.cordova.plugins.Keyboard)
        window.cordova.plugins.Keyboard.close();
    }

    $scope.setGoal = function setGoal() {

      if (!$scope.viewData.goal || $scope.viewData.goal == '') {

        $scope.viewData.error = true;
        return;
      }
      else {
        $scope.viewData.error = false;
      }

      $scope.viewData.submitting = true;

      function successFunction() {
        $ionicLoading.hide();

        $scope.viewData.submitting = false;

        if ($scope.nextState)
          $state.go($scope.nextState);
        else
          history.go(-1);
      }

      $ionicLoading.show({
        template: "Adding Goal..."
      });

      if ($scope.viewData.goalId) {
        GoalService.updateGoal($scope.viewData.goalId, $scope.viewData.goal, $scope.viewData.color)
          .success(successFunction);

        $analytics.eventTrack('updateGoal', {category: 'goals'});
      }
      else {
      	GoalService.addGoal($scope.viewData.goal, $scope.viewData.color)
      		.success(successFunction);

        $analytics.eventTrack('addGoal', {category: 'goals'});
      }
    }
  }
]);

ctrl.controller('GoalsAddSubGoalCtrl', ['$scope', '$stateParams', '$timeout', '$analytics', '$ionicModal', '$ionicPopup', '$ionicLoading', 'AccountService', 'GoalService', 'GeneralService',
  function ($scope, $stateParams, $timeout, $analytics, $ionicModal, $ionicPopup, $ionicLoading, AccountService, GoalService, GeneralService) {

    if (window.StatusBar)
      StatusBar.styleDefault();

    $scope.$on('$destroy', function() {
      if (window.StatusBar)
        StatusBar.styleLightContent();
    });
  	// TODO need to set source from the daily view for the goal that was clicked
  	// so that we aren't just defaulting to the first one.

    var currentDay = GeneralService.getDayString(new Date());

  	$scope.viewData = {
  		subGoal: '',
      error: false,
      submitting: false
  	}
  	$scope.difficulty = 1;

  	// We need these for the picker.
  	$scope.goalOptions = {
  		goals: GoalService.getAccountGoals(),
  		goalOptionOrdinal: 0
  	}

    $scope.colorPercentages = [0, 1];

    // TODO This needs to go somewhere.
    function createValue(ordinate, value) {
      return {
        display: "",
        ordinate: ordinate,
        valueInt: value,
        valueString: null
      };
    }

    $scope.difficultyValues = [10];

    for (var i=0; i<10; ++i) {

      $scope.difficultyValues[i] = createValue(i, i+1);
    }

    $scope.valueData = {
      value: '?', 
      valueIndex: 0,
      percentage: 0.0,
      redraw: 0 // This will be watched in the directive to redraw.
    };

    // Initialize things for when a sub goal is passed in
    $scope.editing = false;
    if ($stateParams.subGoalId) {

      var subGoalId = isNumeric($stateParams.subGoalId) ? +$stateParams.subGoalId : $stateParams.subGoalId;
      var subGoal = GoalService.getSubGoal(currentDay, subGoalId);

      if (subGoal) {
        $scope.goal = GoalService.getGoal(subGoal.goalId);
        $scope.goalOptions.goalOptionOrdinal = $scope.goalOptions.goals.indexOf($scope.goal);

        $scope.viewData.subGoal = subGoal.title;
        $scope.viewData.subGoalId = subGoal.id;

        $scope.valueData.valueIndex = subGoal.difficulty - 1;
        $scope.valueData.value = $scope.difficultyValues[$scope.valueData.valueIndex].value;

        $scope.valueData.userInteracted = true;

        $scope.editing = true;
      }
    }

    if (!$scope.goal)
      $scope.goal = $scope.goalOptions.goals[0];

    $scope.difficultyColors = ["#c8c8c8", GeneralService.getColor($scope.goal.color), "#c8c8c8"];

    function updateDifficultyColors() {
  	  $scope.difficultyColors[1] = GeneralService.getColor($scope.goal.color);
    }

  	$scope.getGoalOptionDisplay = function getGoalOptionDisplay(item) {
  		return item.title;
  	}

  	// Update the goal option with the ordinal that has been set.
    $scope.updateGoalOption = function updateGoalOption() {

      $scope.goal = $scope.goalOptions.goals[$scope.goalOptions.goalOptionOrdinal];

      updateDifficultyColors();

      ++$scope.valueData.redraw;

      $analytics.eventTrack('updateGoal', {category: 'goals'});
    }

    $scope.getColorClass = function getColorClass() {

      return $scope.goal.color;
    }

    $scope.closeAddSubGoalModal = function closeAddSubGoalModal() {

      AccountService.setUserPreference('view_add_experiment_popup', true);

      closeModal($scope.addSubGoalModal);

      history.go(-1);
    }

    $scope.closeKeyboard = function closeKeyboard() {
      if (window.cordova.plugins.Keyboard)
        window.cordova.plugins.Keyboard.close();
    }

  	$scope.setSubGoal = function setSubGoal() {

      if (!$scope.viewData.subGoal || $scope.viewData.subGoal == '') {

        $scope.viewData.error = true;
        return;
      }
      else {
        $scope.viewData.error = false;
      }

      if ($scope.valueData.value == '?') {
        $scope.noDataError = true;
        return;
      }
      else {
        $scope.noDataError = false;
      }

      $scope.viewData.submitting = true;

      function updateSuccessFunction() {

        $ionicLoading.hide();

        $scope.viewData.submitting = false;

        history.go(-1);
      }

      function addSuccessFunction() {


        $ionicLoading.hide();

        $scope.viewData.submitting = false;

        // Check to see if they have not seen the first goal popup.
        var pref = AccountService.getUserPreference('view_add_experiment_popup');
        if (!pref || pref == 'false') {

          $ionicModal.fromTemplateUrl('views/goals/goals.addSubGoalModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            $scope.addSubGoalModal = modal;

            openModal($scope.addSubGoalModal);
          });
        }
        else {
          history.go(-1);
        }
      }

      $ionicLoading.show({
        template: "Setting Experiment..."
      });

      if ($scope.editing) {

        GoalService.updateSubGoal($scope.viewData.subGoalId,
                                  $scope.goal.id,
                                  $scope.viewData.subGoal, 
                                  GeneralService.getDayString(new Date()), 
                                  $scope.difficultyValues[$scope.valueData.valueIndex].valueInt)
          .success(updateSuccessFunction);

        $analytics.eventTrack('updateSubGoal', {category: 'goals'});
      }
      else {

        GoalService.addSubGoal($scope.goal.id, 
                               $scope.viewData.subGoal, 
                               GeneralService.getDayString(new Date()), 
                               $scope.difficultyValues[$scope.valueData.valueIndex].valueInt)
          .success(addSuccessFunction);

        $analytics.eventTrack('addSubGoal', {category: 'goals'});
      }

  	}
  }
]);

ctrl.controller('GoalsHelpCtrl', ['$scope', '$rootScope', '$state', '$http', '$stateParams', '$controller', 'AccountService',
  function ($scope, $rootScope, $state, $http, $stateParams, $controller, AccountService) {

    // Extend the help controller.
    $controller('HelpCtrl', {$scope: $scope});

    $scope.confirm = function() {
      AccountService.setUserPreference('completed_goals_intro', 'true');

      // Hack.
      $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

      $state.go('app.goals', {}, {location: 'replace'});
    }
  }
]);