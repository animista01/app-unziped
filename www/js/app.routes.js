function initializeRoutes($stateProvider) {

	$stateProvider
    .state('app', {
      abstract: true,
      templateUrl: "views/app.html",
      url: "/app",
      controller: 'AppCtrl',
      data: {
        habit: 'none'
      }
    })
    .state('app.account', {
      url: '/account',
      views: {
        'menuContent' :{
          templateUrl: "views/account/account.html",
          controller: 'AccountCtrl'
        }
      }
    })
    .state('app.notifications', {
      url: '/account/notifications',
      views: {
        'menuContent': {
          templateUrl: "views/account/notifications.html",
          controller: 'NotificationCtrl'
        }
      }
    })
    .state('app.nux-intro', {
      url: '/nux',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.intro.html",
          controller: 'NuxCtrl'
        }
      }
    })
    .state('app.nux-anxious', {
      url: '/nux/anxious',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.anxious.html",
          controller: 'NuxAnxiousCtrl'
        }
      }
    })
    .state('app.nux-worry', {
      url: '/nux/worry',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.worry.html",
          controller: 'NuxWorryCtrl'
        }
      }
    })
    .state('app.nux-anxiety', {
      url: '/nux/anxiety',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.anxiety.html",
          controller: 'NuxAnxietyCtrl'
        }
      }
    })
    .state('app.nux-goal', {
      url: '/nux/goal?nextState&nux',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.goal.html",
          controller: 'NuxGoalCtrl'
        }
      }
    })
    .state('app.nux-activities', {
      url: '/nux/activities',
      views: {
        'menuContent' :{
          templateUrl: "views/nux/nux.activities.html",
          controller: 'NuxActivitiesCtrl'
        }
      }
    })
    .state('app.progress', {
      url: '/progress',
      views: {
        'menuContent' :{
          templateUrl: "views/progress/progress.html",
          controller: 'ProgressCtrl'
        }
      }
    })
    .state('app.habits', {
      url: '/habits?date',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/habits/habits.html",
          controller: 'HabitsCtrl'
        }
      }
    })
    .state('app.habits-help', {
      url: '/habits/help?intro&singleSlide',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.help.html',
          controller: 'HabitsHelpCtrl'
        }
      }
    })
    .state('app.habits-config', {
      url: '/habits/config',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.config.html',
          controller: 'HabitsConfigCtrl'
        }
      }
    })
    .state('app.habits-add', {
      url: '/habits/add',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.add.html',
          controller: 'HabitsAddCtrl'
        }
      }
    })
    .state('app.habits-Mood', {
      url: '/habits/mood',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.mood.html',
          controller: 'HabitsMoodCtrl'
        }
      },
      data:{
        habit:  "Mood"
      }
    })
    .state('app.habits-Mood-help', {
      url: '/habits/mood/help?intro',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.mood.help.html',
          controller: 'HabitsMoodHelpCtrl'
        }
      }
    })
    .state('app.habits-Sleep', {
      url: '/habits/sleep?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.sleep.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Sleep"
      }
    })
    .state('app.habits-Exercise', {
      url: '/habits/exercise?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.exercise.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Exercise"
      }
    })
    .state('app.habits-Eating', {
      url: '/habits/eating?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.eating.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Eating"
      }
    })
    .state('app.habits-Caffeine', {
      url: '/habits/caffeine?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.caffeine.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Caffeine"
      }
    })
    .state('app.habits-Alcohol', {
      url: '/habits/alcohol?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.alcohol.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Alcohol"
      }
    })
    .state('app.habits-Water', {
      url: '/habits/water?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.water.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Water"
      }
    })
    .state('app.habits-Outdoors', {
      url: '/habits/outdoors?experiencedDate',
      views: {
        'menuContent': {
          templateUrl: 'views/habits/habits.outdoors.html',
          controller: 'HabitsTypeCtrl'
        }
      },
      data:{
        habit:  "Outdoors"
      }
    })
    .state('app.relax', {
      url: '/relax',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/relax.html",
          controller: 'RelaxCtrl'
        }
      }
    })
    .state('app.relax-help', {
      url: '/relax/help?intro',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/relax.help.html",
          controller: 'RelaxHelpCtrl'
        }
      }
    })
    .state('app.relax-config', {
      url: '/relax/config',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/relax.config.html",
          controller: 'RelaxConfigCtrl'
        }
      }
    })
    .state('app.breathe-help', {
      url: '/breathe/help?intro&cycleLength&bgAudioSource&src',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/breathe.help.html",
          controller: 'BreatheHelpCtrl'
        }
      }
    })
    .state('app.relax-record-help', {
      url: '/relax/record/help?intro&nextState&maxTime&cycleLength&bgAudioSource',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/relax.record.help.html",
          controller: 'RelaxRecordHelpCtrl'
        }
      }
    })
    .state('app.breathe-record', {
      url: '/breathe/record?src&maxTime',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/relax/breathe.record.html",
          controller: 'BreatheRecordCtrl'
        }
      },
      data:{
        audioPrefix: 'breathe',
        nextState: 'app.breathe-exercise',
        nextHelpState: 'app.breathe-help',
        nextHelpStatePreference: 'completed_breathe_intro',
        nextStateCycleLength: 8,
        helpState: 'app.relax-record-help',
        clearRethinkState: false // not used here
      }
    })
    .state('app.breathe-exercise', {
      url: '/breathe/exercise?src&cycleLength&bgAudioSource&cycles',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/breathe.exercise.html",
          controller: 'BreatheExerciseCtrl'
        }
      }
    })
    .state('app.muscles-help', {
      url: '/muscles/help?intro&cycles&cycleLength&bgAudioSource&src',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/muscles.help.html",
          controller: 'MusclesHelpCtrl'
        }
      }
    })
    .state('app.muscles-record', {
      url: '/muscles/record?src&maxTime',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/relax/breathe.record.html",
          controller: 'BreatheRecordCtrl'
        }
      },
      data:{
        audioPrefix: 'muscles',
        nextState: 'app.muscles-exercise',
        nextHelpState: 'app.muscles-help',
        nextHelpStatePreference: 'completed_muscles_intro',
        nextStateCycles: 22,
        helpState: 'app.relax-record-help',
        clearRethinkState: false // not used here
      }
    })
    .state('app.muscles-exercise', {
      url: '/muscles/exercise?src&cycleLength&bgAudioSource&cycles',
      views: {
        'menuContent' :{
          templateUrl: "views/relax/muscles.exercise.html",
          controller: 'MusclesExerciseCtrl'
        }
      }
    })
    .state('app.rethink-list', {
      url: '/rethink/list',
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.list.html",
          controller: 'RethinkListCtrl'
        }
      }
    })
    .state('app.rethink-start', {
      url: '/rethink/start',
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.html",
          controller: 'RethinkCtrl'
        }
      }
    })
    .state('app.rethink-help', {
      url: '/rethink/help?intro',
      views: {
        'menuContent': {
          templateUrl: "views/rethink/rethink.help.html",
          controller: 'RethinkHelpCtrl'
        }
      }
    })
    .state('app.rethink-record', {
      url: '/rethink/record?src&maxTime',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.record.html",
          controller: 'RethinkRecordCtrl'
        }
      },
      data:{
         audioPrefix:  "thoughts",
         nextState: 'app.rethink-replay',
         helpState: 'app.rethink-record-help',
         nextHelpState: 'app.rethink-replay-help',
         nextHelpStatePreference: 'completed_rethink_intro_replay', // These let us short-circuit the path to inject a help screen
         clearRethinkState: true
      }
    })
    .state('app.rethink-record-help', {
      url: '/rethink/record/help?intro',
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.record.help.html",
          controller: 'RethinkRecordHelpCtrl'
        }
      }
    })
    .state('app.rethink-replay', {
      url: '/rethink/replay?src&duration',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.replay.html",
          controller: 'RethinkReplayCtrl'
        }
      }
    })
    .state('app.rethink-replay-help', {
      url: '/rethink/replay/help?intro&src&duration',
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.replay.help.html",
          controller: 'RethinkReplayHelpCtrl'
        }
      }
    })
    .state('app.rethink-analyze', {
      url: '/rethink/analyze?src&thoughtId',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.analyze.html",
          controller: 'RethinkRecordCtrl'
        }
      },
      data:{
         audioPrefix:  "rethink", // the controller uses this to determine if it's going home.
         nextState: 'app.home',
         helpState: 'app.rethink-analyze-help',
         clearRethinkState: false
      }
    })
    .state('app.rethink-analyze-help', {
      url: '/rethink/analyze/help?intro&thoughtId',
      views: {
        'menuContent' :{
          templateUrl: "views/rethink/rethink.analyze.help.html",
          controller: 'RethinkAnalyzeHelpCtrl'
        }
      }
    })
    .state('app.goals', {
      url: '/goals?activeTab',
      reloadOnSearch: false, // So that replacing the date in the url doesn't cause a reload.
      views: {
        'menuContent' :{
          templateUrl: "views/goals/goals.html",
          controller: 'GoalsCtrl'
        }
      }
    })
    .state('app.goals-help', {
      url: '/goals/help?intro',
      views: {
        'menuContent' :{
          templateUrl: "views/goals/goals.help.html",
          controller: 'GoalsHelpCtrl'
        }
      }
    })
    .state('app.goals-addgoal', {
      url: '/goals/addgoal?goalId',
      views: {
        'menuContent' :{
          templateUrl: "views/goals/goals.addGoal.html",
          controller: 'GoalsAddGoalCtrl'
        }
      }
    })
    .state('app.goals-addsubgoal', {
      url: '/goals/addsubgoal?subGoalId',
      views: {
        'menuContent' :{
          templateUrl: "views/goals/goals.addSubGoal.html",
          controller: 'GoalsAddSubGoalCtrl'
        }
      }
    })
    .state('app.login', {
      url: '/login',
      views: {
        'menuContent' :{
          templateUrl: "views/login.html",
          controller: 'LoginCtrl'
        }
      }
    })
    .state('app.home', {
      // templateUrl: 'views/home.html',
      url: '/home',
      views: {
        'menuContent' :{
          templateUrl: "views/home.html",
          controller: 'HomeCtrl'
        }
      }
    }
  );
}