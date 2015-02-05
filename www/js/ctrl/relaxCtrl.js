(function() {

  var ctrl = angular.module('breatheCtrl', []);

  function initializeBreatheParams($scope, AccountService) {

    $scope.bgAudioSources = [
      'Ocean.mp3', 
      'Pinknoise.mp3', 
      'Thunderstorm.mp3', 
      'SummerNight.mp3',
      'RooftopRain.mp3',
      'ForestMorning.mp3',
      'Underwater.mp3',
      'Bach.mp3',
      'none'
    ];

    
    // Adapt the preferences to a spinner. Needs to be in an object to work in angular.
    $scope.soundOptions = {
      options: [
        "Ocean Waves", 
        "White Noise", 
        "Thunderstorm", 
        "Summer Night", 
        "Rooftop Rain", 
        "Forest Morning", 
        "Underwater",
        "Bach Cello Suite #1",
        "No Sound"
      ],
      soundOptionOrdinal: 0
    }

    $scope.cycleOptions = {
      options: [ 10, 15, 20, 25 ],
      cycleOptionOrdinal: 0
    }

    // Pull out the background audio preference if the user has premium enabled.
    // if (AccountService.isPremiumEnabled()) {
      var bgAudioPref = AccountService.getUserPreference('bg_audio_src');
      if (bgAudioPref) {
        var index = $scope.bgAudioSources.indexOf(bgAudioPref);

        if (index >= 0) {
           $scope.soundOptions.soundOptionOrdinal = $scope.bgAudioSources.indexOf(bgAudioPref);
        }
      }

      // Pull out the cycle preference.
      var cyclePref = AccountService.getUserPreference('breathe_cycle_length');
      if (cyclePref)
        $scope.cycleLength = parseInt(cyclePref);
      else
        $scope.cycleLength = 10;

      if ($scope.cycleLength % 5 != 0)
        $scope.cycleLength = 10;
    // }
    // else {
    //   $scope.cycleLength = 10;
    // }

    $scope.cycleOptions.cycleOptionOrdinal = $scope.cycleOptions.options.indexOf($scope.cycleLength);

    $scope.bgAudioSource = $scope.bgAudioSources[$scope.soundOptions.soundOptionOrdinal];

  }

  ctrl.controller('RelaxConfigCtrl', ['$scope', '$http', '$state', '$timeout', '$analytics', '$ionicModal', 'AccountService', 'PayService',
    function ($scope, $http, $state, $timeout, $analytics, $ionicModal, AccountService, PayService) {

      $scope.values = {};

      function resetValues() {
        $scope.values.playBreathing = true;
        $scope.values.meditationMode = false;
      }

      // if (AccountService.isPremiumEnabled()) {
        var pref = AccountService.getUserPreference('disable_breathing_sounds');
        $scope.values.playBreathing = !pref || pref == 'false';

        pref = AccountService.getUserPreference('enable_meditation_mode');
        $scope.values.meditationMode = pref && pref == 'true';
      // }
      // else {
      //   resetValues();
      // }

      $scope.updatePlayBreathing = function(val) {

        AccountService.setUserPreference('disable_breathing_sounds', $scope.values.playBreathing ? 'false' : 'true');
      }

      $scope.updateMeditationMode = function(val) {

        AccountService.setUserPreference('enable_meditation_mode', $scope.values.meditationMode ? 'true' : 'false');
      }

      $scope.showPremiumModal = function showPremiumModal(label) {

        PayService.showPremiumModal($scope, 'relax', label, true);
      }
    }
  ]);

  ctrl.controller('RelaxCtrl', ['$scope', '$http', '$state', '$timeout', '$analytics', '$ionicModal', 'AccountService', 'PayService',
    function ($scope, $http, $state, $timeout, $analytics, $ionicModal, AccountService, PayService) {

      // Don't expose the visualization exercises until users have created a goal.
      var goalPref = AccountService.getUserPreference('view_add_experiment_popup');

      var noVisualization = !goalPref || goalPref == 'false';
      if (noVisualization) {

        $scope.exerciseOptions = {
          options: [
            'Deep Breathing',
            'Muscle Relaxation',
          ],
          exerciseOptionOrdinal: 0
        }
      }
      else {
        $scope.exerciseOptions = {
          options: [
            'Deep Breathing',
            'Visualize + Deep Breathing',
            'Muscle Relaxation',
            'Visualize + Muscle Relaxation'
          ],
          exerciseOptionOrdinal: 0
        }
      }

      var exercisePref = AccountService.getUserPreference('relax_exercise');
      if (exercisePref) {
        var index = $scope.exerciseOptions.options.indexOf(exercisePref);

        if (index >= 0) {
          $scope.exerciseOptions.exerciseOptionOrdinal = index;
        }
      }

      $scope.exercise = $scope.exerciseOptions.options[$scope.exerciseOptions.exerciseOptionOrdinal];

      initializeBreatheParams($scope, AccountService);

      function updateUserPreferences() {

        AccountService.setUserPreference('relax_exercise', '' + $scope.exercise);
        AccountService.setUserPreference('bg_audio_src', '' + $scope.bgAudioSource);
        AccountService.setUserPreference('breathe_cycle_length', '' + $scope.cycleLength);
      }

      $scope.getExerciseOptionDisplay = function getExerciseOptionDisplay(item) {
        return item;
      }

      $scope.getCycleOptionDisplay = function getCycleOptionDisplay(item) {
        return item + ' Second Breath';
      }

      $scope.getSoundOptionDisplay = function getSoundOptionDisplay(item) {
        return item;
      }

      $scope.showPremiumModal = function showPremiumModal(label) {
        
        PayService.showPremiumModal($scope, 'relax', label, true);
      }

      // Update the exercise option with the ordinal that has been set.
      $scope.updateExerciseOption = function updateExerciseOption() {

        // No longer requiring premium for this.
        // if (AccountService.isPremiumEnabled()) {
          $scope.exercise = $scope.exerciseOptions.options[$scope.exerciseOptions.exerciseOptionOrdinal];

          updateUserPreferences();

          $analytics.eventTrack('setExercise', {category: 'relax', label: $scope.exercise });
        // }
        // else {
         
        //   $scope.showPremiumModal('exerciseOption');

        //   $timeout(function() {
        //     $scope.exerciseOptions.exerciseOptionOrdinal = 0;
        //     $scope.exercise = $scope.exerciseOptions.options[$scope.exerciseOptions.exerciseOptionOrdinal];

        //   }, 10);
        // }
      }

      // Update the sound option with the ordinal that has been set.
      $scope.updateSoundOption = function updateSoundOption() {

        // if (AccountService.isPremiumEnabled()) {
          $scope.bgAudioSource = $scope.bgAudioSources[$scope.soundOptions.soundOptionOrdinal];

          updateUserPreferences();

          $analytics.eventTrack('setBackgroundAudio', {category: 'relax', label: $scope.bgAudioSource });
        // }
        // else {
          
        //   $scope.showPremiumModal('soundOption');

        //   $timeout(function() {
        //     $scope.soundOptions.soundOptionOrdinal = 0;
        //     $scope.bgAudioSource = $scope.bgAudioSources[$scope.soundOptions.soundOptionOrdinal];  
        //   }, 10);
        // }
      }

    	$scope.updateCycleLength = function updateCycleLength() {

        // if (AccountService.isPremiumEnabled()) {

          var index = $scope.cycleOptions.options.indexOf($scope.cycleOptions.cycleOptionOrdinal);

          if (index < 0)
      		  index = 0;

          $scope.cycleLength = $scope.cycleOptions.options[index];

          updateUserPreferences();

          $analytics.eventTrack('setCycleLength', {category: 'relax', label: '' + $scope.cycleLength });
        // }
        // else {
          
        //   $scope.showPremiumModal('cycleOption');

        //   $timeout(function() {
        //     $scope.cycleOptions.cycleOptionOrdinal = 0;
        //     $scope.cycleLength = $scope.cycleOptions.options[0];
        //   }, 10);
        // }
    	}

    	$scope.startExercise = function startExercise() {

        var params = {
          cycleLength: $scope.cycleLength, 
          bgAudioSource: $scope.bgAudioSource
        };

        function completedBreatheIntro() {

          var pref = AccountService.getUserPreference('completed_breathe_intro');
          return typeof pref !== 'undefined';          
        }

        function completedVisualizationIntro() {

          var pref = AccountService.getUserPreference('completed_visualization_intro');
          return typeof pref !== 'undefined';
        }

        function completedPMRIntro() {

          var pref = AccountService.getUserPreference('completed_muscles_intro');
          return typeof pref !== 'undefined';
        }

        function goToPMR() {

          params.cycles = 22;

          if (completedPMRIntro()) {
            $state.go('app.muscles-exercise', params); 
          }
          else {
            params.intro = true;

            $state.go('app.muscles-help', params);
          }
        }

        switch($scope.exerciseOptions.exerciseOptionOrdinal) {
          
          case 3: // PMR w Mantra

            params.maxTime = $scope.cycleLength;
              
            if (completedVisualizationIntro()) {
              $state.go('app.muscles-record', params);   
            }
            else {
              params.nextState = 'app.muscles-record';
              params.intro = true;

              $state.go('app.relax-record-help', params);
            }
            break;

          case 2: // PMR

            goToPMR();

            break;

          case 1: // Breathing w/ Mantra OR PMR, depending on the visualization

            if (noVisualization) {
              goToPMR();
            }
            else {
              params.maxTime = $scope.cycleLength;

              if (completedVisualizationIntro()) {
                $state.go('app.breathe-record', params);
              }
              else {
                params.nextState = 'app.breathe-record';
                params.intro = true;

                $state.go('app.relax-record-help', params);
              }
            }
            break;

          case 0:
          default: // Breathing

            if (completedBreatheIntro()) {
              $state.go('app.breathe-exercise', params);   
            }
            else {
              params.intro = true;
              $state.go('app.breathe-help', params);
            }
            break;
        }
    	}
    }
  ]);

  ctrl.controller('BreatheExerciseCtrl', ['$scope', '$rootScope', '$http', '$timeout', '$state', '$stateParams', '$ionicModal', '$analytics', 'AccountService', 'MediaService',
    function ($scope, $rootScope, $http, $timeout, $state, $stateParams, $ionicModal, $analytics, AccountService, MediaService) {

      // Let the app sleep again
      if (window.plugins && window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();

    	var white = '#eee';
    	var black = '#333';
    	var gray = '#ccc';

    	$scope.title = 'Get Ready...';

    	$scope.previousTitle = ''; // for pausing.
    	$scope.previousInstructions = '';
    	$scope.graphColors = [black, gray, white];

      var firstCyclePercentage = 0.4;

      $scope.colorPercentages = [firstCyclePercentage, 1 - firstCyclePercentage];

    	$scope.started = false;
      $scope.finished = false;
      $scope.exited = false;
    	$scope.selectable = false;
    	$scope.cycle = 1;
    	$scope.paused = false;
      $scope.inhale = true;

      var cyclePref = $stateParams.cycles;
      if (cyclePref)
        $scope.cycles = +cyclePref;
      else  
        $scope.cycles = 8;

      var cycleLengthPref = $stateParams.cycleLength;
      
      if (cycleLengthPref)
        $scope.cycleLength = +cycleLengthPref;
      else
        $scope.cycleLength = 10;

      if ($scope.cycleLength % 5 != 0)
        $scope.cycleLength = 10;
    	
      $scope.bgAudioSource = $stateParams.bgAudioSource;

      if (typeof $scope.bgAudioSource == 'undefined') {
        $scope.bgAudioSource = 'Ocean.mp3';
      }

      // Load the previous recording.
      if ($stateParams.src)
        $scope.personalAudio = MediaService.loadMedia($stateParams.src);

      $scope.bgSoundOn = $scope.bgAudioSource != 'none'

      // Determine whether or not the breathing sounds should be played.
      var breathingSoundPref = breathingSoundPref = AccountService.getUserPreference('disable_breathing_sounds');
      $scope.breathingSoundsOn = (typeof breathingSoundPref === 'undefined') || breathingSoundPref == 'false';

      var meditationModePref = meditationModePref = AccountService.getUserPreference('enable_meditation_mode');
      $scope.enableMeditationMode = meditationModePref == 'true';

    	var hasMedia;
    	var inhaleAudio;
    	var exhaleAudio;
      var bgAudio;

      // To determine if we should restart
      var inhaleStatus = 0;
      var exhaleStatus = 0;

      var RUNNING_STATUS = 2;
      var PAUSED_STATUS = 3;
      var STOPPED_STATUS = 4;

      var inhaleVolume = 0.05;
      var exhaleVolume = 0.02;
      var bgVolume = 0;

      var playOptions = { playAudioWhenScreenIsLocked : false };
      var bgPlayOptions = { playAudioWhenScreenIsLocked : false, numberOfLoops: 100 };


      function bgAudioStatus(status) {
        if (status === Media.MEDIA_STOPPED) {
          if ($scope.bgSoundOn && !$scope.exited)
            bgAudio.play();
        }
      }

      var inhaleSrc = 'img/breathing-sounds/Inhale-10.mp3';
      var exhaleSrc = 'img/breathing-sounds/Exhale-10.mp3';

      if ($scope.cycleLength == 15) {
        inhaleSrc = 'img/breathing-sounds/Inhale-15.mp3';
        exhaleSrc = 'img/breathing-sounds/Exhale-15.mp3';
      }
      else if ($scope.cycleLength == 20) {
        inhaleSrc = 'img/breathing-sounds/Inhale-20.mp3';
        exhaleSrc = 'img/breathing-sounds/Exhale-20.mp3';
      }
      else if ($scope.cycleLength == 25) {
        inhaleSrc = 'img/breathing-sounds/Inhale-25.mp3';
        exhaleSrc = 'img/breathing-sounds/Exhale-25.mp3';
      }

      inhaleAudio = MediaService.loadMedia(inhaleSrc, 'inhaleAudio',
        function inhaleMediaStatus(status) {
          inhaleStatus = status;
        }
      );
      MediaService.setVolume(inhaleAudio, inhaleVolume);

      exhaleAudio = MediaService.loadMedia(exhaleSrc, 'exhaleAudio', 
        function exhaleMediaStatus(status) {
          exhaleStatus = status;
        }
      );
      MediaService.setVolume(exhaleAudio, exhaleVolume);

      if ($scope.bgAudioSource != 'none') {

        bgAudio = MediaService.loadMedia('img/background-sounds/' + $scope.bgAudioSource, 'bgAudio', bgAudioStatus);

        MediaService.setVolume(bgAudio, 0);

        if ($scope.bgAudioSource == 'Underwater.mp3') {
          bgVolume = 0.9;
          inhaleVolume = 0.1;
          exhaleVolume = 0.05;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
        }
        else if ($scope.bgAudioSource == 'Thunderstorm.mp3') {
          bgVolume = 0.8;
          inhaleVolume = 0.99;
          exhaleVolume = 0.4;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
        }
        else if($scope.bgAudioSource == 'SummerNight.mp3') {
          bgVolume = 0.75;
          inhaleVolume = 0.7;
          exhaleVolume = 0.15;
          MediaService.setVolume(exhaleAudio, exhaleVolume);
          MediaService.setVolume(inhaleAudio, inhaleVolume);
        }
        else if ($scope.bgAudioSource == 'Ocean.mp3') {
          inhaleVolume = 0.99;
          exhaleVolume = 0.5;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
          bgVolume = 0.6;
        }
        else if ($scope.bgAudioSource == 'Pinknoise.mp3'){
          bgVolume = 0.3;
          inhaleVolume = 0.99;
          exhaleVolume = 0.3;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
        }
        else if ($scope.bgAudioSource == 'RooftopRain.mp3'){
          bgVolume = 0.3;
          inhaleVolume = 0.99;
          exhaleVolume = 0.3;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
        }
        else if ($scope.bgAudioSource == 'Bach.mp3'){
          bgVolume = 0.3;
          inhaleVolume = 0.45;
          exhaleVolume = 0.4;
          MediaService.setVolume(exhaleAudio, exhaleVolume);
          MediaService.setVolume(inhaleAudio, inhaleVolume);
        }
        else if ($scope.bgAudioSource == 'ForestMorning.mp3'){
          bgVolume = 0.99;
          inhaleVolume = 0.3;
          exhaleVolume = 0.08;
          MediaService.setVolume(exhaleAudio, exhaleVolume);
          MediaService.setVolume(inhaleAudio, inhaleVolume);
        }
        else {
          bgVolume = 0.5;
          inhaleVolume = 0.25;
          exhaleVolume = 0.1;
          MediaService.setVolume(inhaleAudio, inhaleVolume);
          MediaService.setVolume(exhaleAudio, exhaleVolume);
        }
      }
      else {
        // so hacky
          bgAudio = {
            play: function() {},
            stop: function() {},
            release: function() {},
            pause: function() {},
            setVolume: function() {}
          }
      }

      var hasMedia = MediaService.isNative();


      $scope.destroyCtrl = function destroyCtrl() {

        if (hasMedia) {
          inhaleAudio.stop();
          inhaleAudio.release();

          exhaleAudio.stop();
          exhaleAudio.release();

          bgAudio.stop();
          bgAudio.release();

          if ($scope.personalAudio) {
            $scope.personalAudio.stop();
            $scope.personalAudio.release();
          }
        }
        else {
          inhaleAudio.pause();
          exhaleAudio.pause();
          bgAudio.pause();

          if ($scope.personalAudio) {
            $scope.personalAudio.pause();
          }
        }

        $scope.exited = true;
      };

      // As soon as we leave, stop the audio. Note that this is wrapped in a function
      // to allow extending controllers to override the destroyCtrl function so it
      // doesn't get passed in to the listener right away.
      $scope.$on('$destroy', function() {
        $scope.destroyCtrl();

        // Let the app sleep again
        if (window.plugins && window.plugins.insomnia)
          window.plugins.insomnia.allowSleepAgain();
      });

    	// var halfCycleLength = $scope.cycleLength / 2;

      var firstCycleLength = $scope.cycleLength / 3;

      $scope.getExerciseTitle = function getExerciseTitle() {

        if ($scope.cycle <= $scope.cycles) {
          return "Cycle " + $scope.cycle + " of " + $scope.cycles;
        }

        return "Activity Complete"
      }

      function createValue(ordinate, value) {
      	return {
      		display: "",
  				ordinate: ordinate,
  				valueInt: value,
  				valueString: null
      	};
      }

      function buildValues(seconds) {

  	    var values = [];

  	    for (var i=0; i<seconds; ++i) {

  	    	// Hacking this in to control the display while the countdown happens.
  	    	if (i == 0)
  	    		values[i] = createValue(i, 3);
  	    	else
  	    		values[i] = createValue(i, i + 1);
  	    }

        // To make it count back down:
  	    // for (var i=0; i<(seconds /2); ++i) {

  	    // 	values[halfCycleLength+i] = createValue(halfCycleLength+i, halfCycleLength-i);
  	    // }

  	    return values;
      }

      $scope.values = buildValues($scope.cycleLength);

      $scope.valueData = {
      	value: $scope.values[0], 
      	valueIndex: 0,
      	percentage: 0.0
      };

      // This will be the time in milliseconds.
      $scope.elapsedTime = 0; 
      $scope.startTime;

      // 0.01 for 5 seconds. Total time is 5 * 1000. So timeout is
      // 5 * 1000 / (step / 0.05)

      var percentageStep = 0.001;

      // var percentageTimeout = (halfCycleLength * 1000) / (0.5 / percentageStep);
      var percentageTimeout = (firstCycleLength * 1000) / (firstCyclePercentage / percentageStep);

      $scope.pause = function pause() {
      	$scope.paused = !$scope.paused;

      	if (!$scope.paused) {
          $scope.startTime = new Date().getTime();

      		$scope.title = $scope.previousTitle;

      		if ($scope.started) {
  	    		breathe();

            if ($scope.breathingSoundsOn) {
              if (inhaleStatus == PAUSED_STATUS)
                inhaleAudio.play(playOptions);
              else if (exhaleStatus == PAUSED_STATUS)
                exhaleAudio.play(playOptions);
            }

  	    		if ($scope.bgSoundOn) {
  	    			bgAudio.play(bgPlayOptions);
  	    		}

            if ($scope.personalAudioPosition > 0)
              $scope.personalAudio.play(playOptions);
  	    	}
  	    	else {
  	    		countDown();
  	    	}

          $analytics.eventTrack('playBreatheExercise', {category: 'relax' });
      	}
      	else {
          // Update the elapsed time.
          if ($scope.started) {
            $scope.elapsedTime += new Date().getTime() - $scope.startTime;
            $scope.valueData.percentage = ($scope.elapsedTime / 1000) / $scope.cycleLength;
          }

      		$scope.previousTitle = $scope.title;

      		$scope.title = 'Paused';

      		if ($scope.breathingSoundsOn) {
            if (inhaleStatus == RUNNING_STATUS || inhaleStatus == 0)
              inhaleAudio.pause();
            else if (exhaleStatus == RUNNING_STATUS || exhaleStatus == 0)
              exhaleAudio.pause();
      		}

          if ($scope.bgSoundOn) {
            bgAudio.pause();
          }


          if ($scope.personalAudio) {
            $scope.personalAudio.getCurrentPosition(function(pos) {

              // Only used for pausing this.
              $scope.personalAudioPosition = pos;

              $scope.personalAudio.pause();
            });
          }
           
          $analytics.eventTrack('pauseBreatheExercise', {category: 'relax' });
      	}
      }

      function breathe() {

      	if ($scope.paused || $scope.exited || $scope.finished)
      		return;

      	if ($scope.valueData.percentage == 0.0) {

          if ($scope.breathingSoundsOn) {
      			if (!hasMedia)
      				inhaleAudio.load(); // resets the location.
      			inhaleAudio.play(playOptions);
          }

          // Play the audio.
          if ($scope.personalAudio) {

            // Increase the volume per-cycle.
            var personalVolume = 0.5 + (0.5 * ($scope.cycle / $scope.cycles));

            console.log("setting volume: " + personalVolume);
            
            $scope.personalAudio.setVolume(personalVolume);

            $scope.personalAudio.play(playOptions);
          }

          $scope.graphColors[0] = black;
      		$scope.graphColors[1] = white;
      		$scope.graphColors[2] = gray;

      		$scope.title = 'Inhale';
      		$scope.instructions = 'INHALE slowly through your nose, pushing your belly out.';

          $scope.inhale = true;
      	}
        else if ($scope.valueData.percentage >= firstCyclePercentage && $scope.inhale) {
      		
          if ($scope.breathingSoundsOn) {
      			if (!hasMedia)
      				exhaleAudio.load();
      			exhaleAudio.play(playOptions);
          }

      		// We used to flip these. Leaving this here to remember how still.
          // $scope.graphColors[0] = black;
      		// $scope.graphColors[1] = white;
      		// $scope.graphColors[2] = gray;

      		$scope.title = 'Exhale';
      		$scope.instructions = 'EXHALE slowly through your mouth, pushing out all the air.';

          $scope.inhale = false;
      	}

        var currentTime = new Date().getTime();
        var elapsedTime = $scope.elapsedTime + (currentTime - $scope.startTime);

        var nextPercentage = (elapsedTime / 1000) / $scope.cycleLength;

    		if (nextPercentage >= 0.999) {
    			
	    		if ($scope.cycle < $scope.cycles || $scope.enableMeditationMode) {

            // Record any activities we need to but be sure to do this only once
            if ($scope.cycle == $scope.cycles) {
              $scope.preFinishExercise();
            }

            $scope.valueData.percentage = 0.0;
            $scope.elapsedTime = 0.0;
            $scope.startTime = new Date().getTime();

	    			++$scope.cycle;

            // Allowing for extending controllers to know when the cycle advances.
            if ($scope.advanceCycle)
              $scope.advanceCycle();

            $scope.inhale = true;

	    			$timeout(breathe, percentageTimeout);
	    		}
	    		else {
            $scope.preFinishExercise();

            // This will cause a watch in the directive to go off.
            // $scope.valueData.percentage = 1.0;

	    			$scope.title = "Finished";
	    			$scope.instruction = "Finished";

            $scope.finished = true;

            $scope.valueData.value = 3;

            // 3,2,1 to finish
            $timeout(fadeOut, 1000);
            $timeout(countDown, 1000);
	    		}
    		}
    		else {
          // Some timing issues with updating this when the exercise is ending.
          $scope.valueData.percentage = nextPercentage;

    			$timeout(breathe, percentageTimeout);
    		}
      }

      $scope.startExercise = function startExercise() {
        
        if ($scope.exited)
          return;

      	$scope.started = true;

        $scope.startTime = new Date().getTime();

      	// Fix this so the display is correct.
      	$scope.values[0].valueInt = 1;

      	breathe();
      }

      $scope.closeRelaxGoalModal = function closeRelaxGoalModal() {

        AccountService.setUserPreference('viewed_relax_goal_popup', true);

        closeModal($scope.relaxGoalModal);

        $scope.finishExercise();
      }

      $scope.checkForRelaxGoalModal = function checkForRelaxGoalModal() {

        var openedModal = false;

        var pref = AccountService.getUserPreference('viewed_relax_goal_popup');
        if (!pref || pref == 'false') {

          $ionicModal.fromTemplateUrl('views/relax/relax.goalModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            $scope.relaxGoalModal = modal;

            openModal($scope.relaxGoalModal);
          });

          openedModal = true;
        }

        return openedModal;
      }

      $scope.preFinishExercise = function preFinishExercise() {

        AccountService.recordActivity('COMPLETED_BREATHING');
        // Different from above so we don't have to query for activities all the time
        AccountService.setUserPreference('completed_relax', 'true'); 

        $analytics.eventTrack('finishBreatheExercise', {category: 'relax' });
      }

      $scope.finishExercise = function finishExercise() {

        if ($scope.checkForRelaxGoalModal())
          return;

        $state.go('app.home');

        $timeout(function() {
          $rootScope.$broadcast('event:reachedGoal');
        }, 500);
      }

      var fadeSteps = 100;
      var step = 0;
      function fadeIn() {

        if (hasMedia)
          bgAudio.setVolume(bgVolume * (step / fadeSteps));
        else
          bgAudio.volume = bgVolume * (step / fadeSteps);

        if (step < fadeSteps) {
          $timeout(fadeIn, 3000 / 100);
          ++step;
        }
        else {
          step = 0;
        }
      }

      function fadeOut() {

        if (hasMedia)
          bgAudio.setVolume(bgVolume * ((fadeSteps - step) / fadeSteps));
        else
          bgAudio.volume = bgVolume * ((fadeSteps - step) / fadeSteps);

        if (step < fadeSteps) {
          $timeout(fadeOut, 3000 / 100);
          ++step;
        }
        else {
          step = 0;
        }
      }

      var firstRun = true;

      // We nedd a way to prevent the countdown from firing if the user
      // paused and then played the app before the 2 seconds were up.
      function startCountDown() {

        if (firstRun) {
          countDown();
        }
      }

      function countDown() {	

      	if ($scope.paused || $scope.exited)
      		return;

        if (firstRun) {
          if ($scope.bgSoundOn)
            bgAudio.play(bgPlayOptions);

          fadeIn();

          firstRun = false;
        }

      	if ($scope.valueData.value > 0) {
      		$scope.valueData.value = $scope.valueData.value - 1;

      		$timeout(countDown, 1000);
      	}
      	else {

          if (!$scope.started)
      		  $scope.startExercise();
          else
            $scope.finishExercise();
      	}
      }

      // Perform the countdown.
      $timeout(startCountDown, 2000)
    }
  ]);

  ctrl.controller('BreatheRecordCtrl', ['$scope', '$state', '$stateParams', '$http', '$controller', '$timeout', 'AccountService',
    function ($scope, $state, $stateParams, $http, $controller, $timeout, AccountService) {

      // Inherit from the Breathe controller. This will handle setting
      // of the user preferences. If we need different settings for
      // this we'll have to break the functionality out into a service.
      $controller('RethinkRecordCtrl', {$scope: $scope});

      initializeBreatheParams($scope, AccountService);

      $scope.nextStep = function nextStep() {

        // Once we go to the next step, we cannot append to the recording anymore.
        $scope.mediaRec.stopRecord();

        $scope.clearCache();

        // We need to check the permission for each of the following states
        var pref = AccountService.getUserPreference($state.current.data.nextHelpStatePreference);

        var params = {
          src: $scope.src,
          cycleLength: $scope.cycleLength,
          bgAudioSource: $scope.bgAudioSource,
          cycles: $state.current.data.nextStateCycles
        };

        var goTo = $state.current.data.nextState;
        if (!pref) {
          goTo = $state.current.data.nextHelpState;
          params.intro = true;
        }

        // Need a digest cycle for the replace to happen.
        $timeout(function() {
          $state.go(goTo, params);
        }, 1);
      }
    }
  ]);

  ctrl.controller('MusclesExerciseCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$controller', '$timeout', '$analytics', 'AccountService', 'MediaService',
    function ($scope, $rootScope, $state, $stateParams, $http, $controller, $timeout, $analytics, AccountService, MediaService) {

      // Inherit from the Breathe exercise controller.
      $controller('BreatheExerciseCtrl', {$scope: $scope});

      // We're going to override this and take control of the start exercise call
      // in order to play the background audio.
      $scope.overriddenStartExercise = $scope.startExercise;

      $scope.startExercise = function startExercise() {

        $scope.overriddenStartExercise();
      }

      $scope.isBreatheCycle = 'is_true';

      $scope.advanceCycle = function advanceCycle() {

        if ($scope.cycle >= 3 && $scope.cycle <= $scope.cycles) {
          var groupNum = $scope.getGroupNumber();

          console.log("advanced cycle. Set volume: " + (groupNum / 10));

          if ($scope.cycle % 2 == 0) {
            $scope.isBreatheCycle = 'is_true';

            // Hack to try to avoid a flash that is happening with the number showing right
            // before the tense cycle starts.
            $timeout(function() {
              $(".chart-wrap .val").show();
            }, 10);
          }
          else {
            $scope.isBreatheCycle = 'is_false';

            $(".chart-wrap .val").hide();
          }
            
        }
        else {
          $scope.isBreatheCycle = 'is_true';

          $(".chart-wrap .val").show();
        }
      }


      $scope.getGroupNumber = function getGroupNumber() {

        // Subtract one since 1,2 are for breathing.
        return Math.floor(($scope.cycle-1) / 2);
      }

      $scope.getExerciseTitle = function getExerciseTitle() {

        if ($scope.cycle <= 2)
          return 'Cycle ' + $scope.cycle + ' of 2';
        else if ($scope.cycle <= $scope.cycles)
          return 'Muscle Group ' + $scope.getGroupNumber() + ' of 10';

        return "Activity Complete";
      }

      $scope.getExerciseHeader = function getExerciseTitle() {

        if (!$scope.started) {
          return "GET READY...";
        }
        if ($scope.finished) {
          return 'FINISHED' 
        }


        if ($scope.inhale) {

          if ($scope.cycle >= 3 && $scope.cycle <= $scope.cycles && ($scope.cycle-1) % 2 == 0) {
            switch ($scope.getGroupNumber()) {
              case 10: return 'TENSE YOUR FACE';
              case 9: return 'TENSE SHOULDERS';
              case 8: return 'TENSE ARMS';
              case 7: return 'TENSE HANDS';
              case 6: return 'TENSE CHEST';
              case 5: return 'TENSE STOMACH';
              case 4: return 'TENSE HIPS';
              case 3: return 'TENSE THIGHS';
              case 2: return 'TENSE CALVES';
              case 1: return 'TENSE FEET';
            }
          }
          else {
            return 'INHALE';
          }
        }
        else {

          if ($scope.cycle >= 3 && $scope.cycle <= $scope.cycles && ($scope.cycle-1) % 2 == 0) {
            switch ($scope.getGroupNumber()) {
              case 10: return 'RELAX YOUR FACE';
              case 9: return 'RELAX SHOULDERS';
              case 8: return 'RELAX ARMS';
              case 7: return 'RELAX HANDS';
              case 6: return 'RELAX CHEST';
              case 5: return 'RELAX STOMACH';
              case 4: return 'RELAX HIPS';
              case 3: return 'RELAX THIGHS';
              case 2: return 'RELAX CALVES';
              case 1: return 'RELAX FEET';
            } 
          }
          else {
            return 'EXHALE';
          }
        }
      }

      $scope.getExerciseInstructions = function getExerciseTitle() {

        if ($scope.cycle <= 2) {

          return "Before we begin, take a few breaths to calm yourself."
        }
        else if ($scope.cycle > $scope.cycles) {

          // Inherit from the parent controller.
          return $scope.instructions;
        }
        else if ($scope.inhale) {

          if (($scope.cycle+1) % 2 == 0) {
            return "On inhale, tense the muscle as hard as you can and hold. Notice the tightness.";
          }
          else {
            return 'Before we continue, take a deep breathe. Notice your relaxation.';
          }
        }
        else {

          if (($scope.cycle+1) % 2 == 0) {
            return "On exhale, let go and relax completely. Notice the difference.";
          }
          else {
            return 'Before we continue, take a deep breathe. Notice your relaxation.';
          }
        }
      }

      $scope.preFinishExercise = function preFinishExercise() {

        AccountService.recordActivity('COMPLETED_MUSCLE_RELAXATION');

        // We want this so we don't have to query for all activities all the time.
        AccountService.setUserPreference('completed_relax', 'true');

        $analytics.eventTrack('finishMuscleExercise', {category: 'relax' });
      }

      $scope.finishExercise = function finishExercise() {

        if ($scope.checkForRelaxGoalModal())
          return;

        $state.go('app.home');

        $timeout(function() {
          $rootScope.$broadcast('event:reachedGoal');
        }, 500);
      }
    }
  ]);

  ctrl.controller('RelaxHelpCtrl', ['$scope', '$rootScope', '$state', '$http', '$stateParams', '$controller', 'AccountService',
    function ($scope, $rootScope, $state, $http, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_relax_intro', 'true');

        // Hack.
        $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

        $state.go('app.relax', {}, {location: 'replace'});
      }
    }
  ]);

  ctrl.controller('RelaxRecordHelpCtrl', ['$scope', '$rootScope', '$state', '$http', '$stateParams', '$controller', 'AccountService',
    function ($scope, $rootScope, $state, $http, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_visualization_intro', 'true');

        // Hack.
        $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

        $state.go($stateParams.nextState, {
          maxTime: $stateParams.maxTime,
          cycleLength: $stateParams.cycleLength,
          bgAudioSource: $stateParams.bgAudioSource
        }, 
        {
          location: 'replace'
        });
      }
    }
  ]);

  ctrl.controller('BreatheHelpCtrl', ['$scope', '$rootScope', '$state', '$http', '$stateParams', '$controller', 'AccountService',
    function ($scope, $rootScope, $state, $http, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_breathe_intro', 'true');

        // Hack.
        $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

        $state.go('app.breathe-exercise', {
          cycleLength: $stateParams.cycleLength,
          bgAudioSource: $stateParams.bgAudioSource,
          src: $stateParams.src
        }, 
        {
          location: 'replace'
        });
      }
    }
  ]);

  ctrl.controller('MusclesHelpCtrl', ['$scope', '$rootScope' ,'$state', '$http', '$stateParams', '$controller', 'AccountService',
    function ($scope, $rootScope, $state, $http, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

      $scope.confirm = function() {
        AccountService.setUserPreference('completed_muscles_intro', 'true');

        // Hack.
        $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

        $state.go('app.muscles-exercise', {

          cycles: $stateParams.cycles,
          cycleLength: $stateParams.cycleLength,
          bgAudioSource: $stateParams.bgAudioSource,
          src: $stateParams.src
        }, 
        {
          location: 'replace'
        });
      }
    }
  ]);

})();