(function() {

	var ctrl = angular.module('rethinkCtrl', []);

	var recordingId = 0;

	function checkMicAccess($ionicPopup, $state) {

		if (navigator.microphone) {
	    navigator.microphone(function (on) {
			  if (on) {
			    // now you can use the Cordova media plugin to record
			  }
			  else {
			    // instruct how to enable your app's access to the microphone
			    $ionicPopup.alert({
			    	title: '',
			    	template: '<div>This activity requires access to your microphone. To turn it on, please go to your iPhone Settings, select Privacy, and then select Microphone. You can re-enable access for Pacifica there.</div>',
	      		okText: 'OK, GOT IT.',
	      		okType: 'button-default'
	      	})
	      	.then(function() {

		        if ($state.current.name == 'app.rethink-record' ||
		        	  $state.current.name == 'app.breathe-record' ||
		        	  $state.current.name == 'app.muscles-record')
		        	history.go(-1);
	      	});

			  }
			});
	  }
	}

	ctrl.controller('RethinkCtrl', ['$scope', '$state', '$ionicPopup', 'AccountService',
		function ($scope, $state, $ionicPopup, AccountService) {

	    console.log("rethink ctrl");

	    $scope.goToRecord = function goToRecord() {

	    	if (!AccountService.getUserPreference('completed_rethink_intro_record'))
	    		$state.go('app.rethink-record-help', {
	    			intro: true
	    		});
	    	else
	    		$state.go('app.rethink-record');
	    }

	   	$scope.recordingInfo = function recordingInfo() {
				$ionicPopup.alert({
      		title: '',
      		template: '<div>In this activity, you\'ll be recording your thoughts and listening back to them. Make sure you\'re in a place where you\'re comfortable.</div>',
      		okText: 'OK, GOT IT.',
      		okType: 'button-default'
      	});
	    }
	  }

	]);

	ctrl.controller('RethinkHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$controller', 'AccountService',
		function ($scope, $rootScope, $state, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

	    $scope.confirm = function() {
	      AccountService.setUserPreference('completed_rethink_intro', 'true');

        // Hack.
	      $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

	      $state.go('app.rethink-list', {}, {location: 'replace'});
	    }
	  }
	]);

	ctrl.controller('RethinkRecordHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$controller', 'AccountService',
		function ($scope, $rootScope, $state, $stateParams, $controller, AccountService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

	    console.log("rethink record help ctrl");

	    $scope.confirm = function() {
	      AccountService.setUserPreference('completed_rethink_intro_record', 'true');

        // Hack.
	      $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

	      $state.go('app.rethink-record', {}, {location: 'replace'});
	    }
	  }
	]);

	ctrl.controller('RethinkReplayHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$controller', 'AccountService',
		function ($scope, $rootScope, $state, $stateParams, $controller, AccountService) {
			
      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

	    console.log("rethink replay help ctrl");

	    $scope.confirm = function() {

	      AccountService.setUserPreference('completed_rethink_intro_replay', 'true');

        // Hack.
	      $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

	      // Pass along the src and duration.
	      $state.go('app.rethink-replay', {
	      	duration: +$stateParams.duration
	      }, 
	      {
	      	location: 'replace'
	      });
	    }
	  }
	]);

	ctrl.controller('RethinkAnalyzeHelpCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$controller', 'AccountService', 'AudioService',
		function ($scope, $rootScope, $state, $stateParams, $controller, AccountService, AudioService) {

      // Extend the help controller.
      $controller('HelpCtrl', {$scope: $scope});

	    console.log("rethink analyze help ctrl");

	    $scope.confirm = function() {
	      AccountService.setUserPreference('completed_rethink_intro_analyze', 'true');

        // Hack.
	      $rootScope.$viewHistory.currentView = $rootScope.$viewHistory.backView;

	      var thoughtId = AudioService.getActiveThoughtId();
	      $state.go('app.rethink-analyze', {
	      	thoughtId: thoughtId
	      }, 
	      {
	      	location: 'replace'
	      });
	    }
	  }
	]);

	ctrl.controller('RethinkListCtrl', ['$scope', '$http', '$state', '$stateParams', '$controller', '$timeout', '$analytics', '$ionicPopup', '$ionicGesture', 'AccountService', 'AudioService', 'GeneralService', 'Environment',
		function ($scope, $http, $state, $stateParams, $controller, $timeout, $analytics, $ionicPopup, $ionicGesture, AccountService, AudioService, GeneralService, Environment) {

			// Create a copy.
			function reloadThoughts() {

				// We don't handle offline thoughts yet.
				AudioService.clearNonPersistedGoals();

				$scope.thoughts = AudioService.getThoughts().slice(0);

				// Sort the copy.
				$scope.thoughts.sort(function(a,b) {
					var aDate = new Date(a.createdAtString);
					var bDate = new Date(b.createdAtString);

					return bDate - aDate;
				});
			}

			reloadThoughts();

			$scope.showingDetails = {};

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

			var openThoughtElement;

			function closeThoughtElement() {

				if (openThoughtElement) {
	         angular.element(openThoughtElement).addClass("hideRemove");
	         openThoughtElement = undefined;
	       }
			}

	    function elementDragged(e) {

	    	// Let any swipe close the elements
	    	for (var key in $scope.showingDetails) {
	    		
	    		delete $scope.showingDetails[key];
	    	}

	      if (e.type == 'dragleft') {

	        closeThoughtElement();

	        var elementScope = angular.element(e.currentTarget).scope();
	        openThoughtElement = e.currentTarget;
	        
	        angular.element(e.currentTarget).removeClass("hideRemove");
	      }
	      else {

	        angular.element(e.currentTarget).addClass("hideRemove");

	        openThoughtElement = undefined;
	      }

	      $scope.$apply();
	    }

			$scope.getThoughtDay = function getThoughtDay(thought) {

				var date = new Date(thought.createdAtString);

				return GeneralService.getDateDisplay(date);
			}

			$scope.getThoughtTime = function getThoughtTime(thought) {

				var date = new Date(thought.createdAtString);

				return GeneralService.getMinuteDisplay(date);
			}

			$scope.getMarks = function getMarks(thought, positive) {

				var count = 0;

				var recordings = thought.recordings;

				for (var type in recordings) {

					var recording = recordings[type];
					if (recording.tags) {

						for (var i=0; i<recording.tags.length; ++i) {

							var tag = recording.tags[i];
							if (positive && tag.tagTypeString == 'positive')
								++count;
							else if (!positive && tag.tagTypeString == 'negative')
								++count;
						}
					}
				}

				return count;
			}

			function getRecordingAttribute(thought, type, attribute) {

				if (thought.recordings && thought.recordings[type])
					return thought.recordings[type][attribute];
			}

			$scope.getRecordingSource = function getRecordingSource(thought, type) {

				return getRecordingAttribute(thought, type, 'url');
			}

			$scope.getRecordingDuration = function getRecordingDuration(thought, type) {

				return getRecordingAttribute(thought, type, 'duration');
			}

			$scope.getRecordingTags = function getRecordingTags(thought, type) {

				return getRecordingAttribute(thought, type, 'tags');
			}

			$scope.showDetails = function showDetails(thought) {

				$analytics.eventTrack('toggleThoughtDetails', {category: 'thoughts'});

				closeThoughtElement();

				var otherId;
				var foundThought = false;
				for (var key in $scope.showingDetails) {

					if (key == thought.id)
						foundThought = true;
					else
						otherId = key;
				}

				if (!foundThought) {
					// You can't click on a row to close it anymore, you can only
					// expand other ones.
					if (otherId)
						delete $scope.showingDetails[otherId];

					$scope.showingDetails[thought.id] = true;
				}
			}

			$scope.isShowingDetails = function isShowingDetails(thought) {

				return $scope.showingDetails[thought.id];
			}

			$scope.renameThought = function renameThought(thought) {

				if (!$scope.isShowingDetails(thought))
					return;

				$scope.renamePopupData = {
					title: thought.title
				}

				$ionicPopup.show({
					title: 'Rename Thought',
					template: 'Name your thought record:<br><input type="text" ng-model="renamePopupData.title" autofocus>',
					scope: $scope,
					buttons: [
						{ text: 'Cancel'},
						{
							text: 'Save',
							type: 'button-default',
							onTap: function(e) {
								thought.title = $scope.renamePopupData.title;

								AudioService.updateThoughtTitle(thought.id, thought.title);
							}
						}
					]
				});
				// .then(function(res) {
				// 	thought.title = res;

				// 	AudioService.updateThoughtTitle(thought.id, res);
				// });

				event.preventDefault();
				event.stopPropagation();
			}

			$scope.archiveThought = function archiveThought(thought) {

				event.stopPropagation();
				event.preventDefault();

				function remove() {
					if (Environment.isOnline()) {
						AudioService.archiveThought(thought.id);

						reloadThoughts();
					}
					else {
						var alertPopup = $ionicPopup.alert({
	            title: 'Error',
	            template: 'You may only remove thought records when you are online. Please try again later.',
	            okText: 'OK, GOT IT.',
                okType: 'button-default'
	          });
					}
				}

				var confirmPopup = $ionicPopup.confirm({
			     // title: 'Alert',
			     template: '<div class="thisisatest">Are you sure you want to remove this thought record?</div>',
			     cancelText: 'CANCEL',
        		 cancelType: 'button-default',
        		 okText: 'REMOVE',
        		 okType: 'button-default'
			   });
			   confirmPopup.then(function(res) {

			     if(res) {
			      
			      remove();
			     } else {
			       console.log("close.");
			     }
			   });
			}
	  }
	]);


	function loadFile(src, callback) {
		function onFileSystemSuccess(fileSystem) {

			// Need to create file to record to it.
			fileSystem.root.getFile(src, {create: true, exclusive: false}, 
				function onGetSucceed(fileEntry) {
					callback(fileEntry);
				}, 
				function onGetFail() {
					console.log("did not get file.");
				});
		}

		function fail() {
			console.log("failed getting filesystem");
		}

		if (window.LocalFileSystem)
			window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, onFileSystemSuccess, fail);
	}

	// We are going to use this to cache media when moving between different views.
	// We need to keep the Media object alive or we can't append a recording to it.

	var mediaCache = {};

	function loadMedia(Environment, src, scope, statusCallback) {

		if (mediaCache[src]) {
			scope.mediaRec = mediaCache[src];

			scope.elapsedTime = scope.mediaRec.__elapsedTime;
			if (!scope.elapsedTime)
				scope.elapsedTime = 0;

		}
		else {
			// Doing it this way seems to get around an issue with the file not being
			// available at the localhost/temporary location right away.
			function createMedia(filePath) {

				// var path = "cdvfile://localhost/temporary/" + src;

				// Note that we're intentionally not using the MediaService here. Recording
				// needs to go to a specific location.
				scope.mediaRec = new Media(filePath,
			    // success callback
			    function(data) {
			        console.log("Created media: " + filePath);
			    },

			    // error callback
			    function(err) {
			        console.log("Could not create media [" + filePath + "] " + err.code + ", " + err.message);
			    },

			    statusCallback);

				// Not sure if this will help the visualize stuff.
				scope.mediaRec.setVolume(1);

				// We only store a single object in the cache at a time, so delete anything
				// else that is there.
				clearMediaCache();

				mediaCache[src] = scope.mediaRec;
			}

			loadFile(src, function(fileEntry) {
				if (Environment.isAndroid())
					createMedia(fileEntry.nativeURL);
				else
					createMedia(fileEntry.fullPath);
			});
		}
	}

	function clearMediaCache() {

		for (var key in mediaCache) {

			mediaCache[key].release();

			delete mediaCache[key];
		}
	}

	function addBackButtonOverride($ionicPopup, $ionicNavBarDelegate, msg, successCallback, clickCallback) {
		window.backButtonOverride = function backButtonOverride() {
			  
      if (clickCallback)
     		clickCallback();

	  	var confirmPopup = $ionicPopup.confirm({
		     // title: 'Alert',
		     template: '<div class="thisisatest">' + msg + '</div>',
		     cancelText: 'CANCEL',
        	 cancelType: 'button-default',
        	 okText: 'CONFIRM',
        	 okType: 'button-default'
		   });
		   confirmPopup.then(function(res) {

		     if(res) {
		       
		       if (successCallback) 
		   	   	 successCallback();

		       history.go(-1);
		     } else {
		       console.log("close.");

		     }
		   });
		};
	}

	// Make sure that we aren't using any old state somehow.
	function clearRethinkState() {

		localStorage.removeItem("rethinkReplayState");
	}

	ctrl.controller('RethinkRecordCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$http', '$timeout', '$location', '$analytics', '$ionicModal', '$ionicPopup', '$ionicNavBarDelegate', '$ionicViewService', 'AccountService', 'AudioService', 'GeneralService', 'Environment',
		function ($scope, $rootScope, $state, $stateParams, $http, $timeout, $location, $analytics, $ionicModal, $ionicPopup, $ionicNavBarDelegate, $ionicViewService, AccountService, AudioService, GeneralService, Environment) {

      // Don't let the app fall asleep during breathe.
      if (window.plugins && window.plugins.insomnia)
        window.plugins.insomnia.keepAwake();

      checkMicAccess($ionicPopup, $state);

			$scope.mediaRec;
			$scope.recording = false;
			$scope.elapsedTime = 0.0;
			$scope.src;

			$scope.maxTime = $stateParams.maxTime;
			if (!$scope.maxTime)
				$scope.maxTime = 120;

			// The Record and Analyze states are nearly identical, so we just pass in 
			// some data to define how they operate.
			$scope.audioPrefix = $state.current.data.audioPrefix;
			$scope.nextState = $state.current.data.nextState;
			$scope.helpState = $state.current.data.helpState;
			$scope.clearRethinkState = $state.current.data.clearRethinkState;

			if (!Environment.isOnline() && $scope.audioPrefix == 'thoughts') {

				var alertPopup = $ionicPopup.alert({
          title: 'Warning',
          template: 'You can record your thoughts in offline mode, but they won\'t be stored for later use.',
          okText: 'OK, GOT IT.',
          okType: 'button-default'
        });
			}

			// Thought ID should be here in two instances: you have come back to the 
			// initial step after recording once, or you are on the last step.
			var thoughtId = AudioService.getActiveThoughtId();
			if (thoughtId)
				$scope.thoughtId = thoughtId;

			$scope.initializeSource = function initializeSource(src, forceReplace) {

				// HACK for startsWith here. Don't want to reload 
				if (src && !src.startsWith('rethink') && mediaCache[src]) {
					$scope.src = src;

					loadMedia(Environment, $scope.src, $scope);

					// If you didn't start recording before going to help and coming back,
					// the elapsedTime will be 0.
					if ($scope.elapsedTime > 0)
						$scope.finishedRecording = true;
				}
				else {
					clearMediaCache();

					var extension = Environment.isAndroid() ? '.amr' : '.m4a';

					$scope.src = $scope.audioPrefix + (++recordingId) + extension;

					$scope.finishedRecording = false;

					loadMedia(Environment, $scope.src, $scope);
				}

				// location.search has issues on Android, keep track of it this way.
				if (!$scope.src.startsWith('rethink'))
					AudioService.setActiveSource($scope.src);
			}

			$scope.initializeSource(AudioService.getActiveSource());

			addBackButtonOverride($ionicPopup, 
				                    $ionicNavBarDelegate, 
				                    'Are you sure you want to go back? Your recording will be lost.',
				                    function() {

				                    	clearMediaCache();
				                    },
				                    function() {
				                    	$scope.stopRecording();
				                    });

			// Make sure that we aren't using any old state somehow (for the initial
			// recording, we don't want to do this in the last step).
			if ($scope.clearRethinkState)
				clearRethinkState();

			// Reset the recording state by creating a new file.
			$scope.resetRecording = function resetRecording() {

				$analytics.eventTrack('resetRecordingPopup', {category: 'thoughts'});

				var confirmPopup = $ionicPopup.confirm({
          // title: 'Alert',
          template: '<div class="thisisatest">Are you sure you want to reset this recording?</div>',
          cancelText: 'CANCEL',
          cancelType: 'button-default',
          okText: 'RESET',
          okType: 'button-default'
        });
        confirmPopup.then(function(res) {

        	if (res) {
        		$scope.initializeSource(undefined, true);

						$scope.recording = false;
						$scope.elapsedTime = 0.0;

						$analytics.eventTrack('resetThought', {category: 'thoughts', label: $scope.audioPrefix});

        		$analytics.eventTrack('resetRecordingConfirm', {category: 'thoughts'});
        	}
        	else {
        		$analytics.eventTrack('resetRecordingCancel', {category: 'thoughts'});
        	}
        });
			}

			$scope.$on('$destroy', function() {
				window.backButtonOverride = undefined;

				// No. we're caching this now.
				// if ($scope.mediaRec) {
				// 	console.log("releasing media");
				// 	$scope.mediaRec.release();
				// }

	      // Let the app sleep again
	      if (window.plugins && window.plugins.insomnia)
	        window.plugins.insomnia.allowSleepAgain();
			});

			$scope.stopRecording = function stopRecording() {

				// This is a custom function added to Media.js
				$scope.mediaRec.pauseRecord();

				$scope.recording = false;
				$scope.finishedRecording = true;
			}

	    $scope.recordAudio = function testAudio() {

	    	if (!$scope.canRecord())
	    		return;
	    	
	    	if ($scope.finishedRecording) {
	    		$scope.finishedRecording = false;
	    		$scope.mediaRec.resumeRecord();

	    		$analytics.eventTrack('resumeRecordThought', {category: 'thoughts', label: $scope.audioPrefix});
	    	}
	    	else {
		    	$scope.mediaRec.startRecord();

		    	$analytics.eventTrack('recordThought', {category: 'thoughts', label: $scope.audioPrefix});
		    }

		    $scope.recording = true;

		    $timeout($scope.updateTime, 1000);
		  }

		  $scope.showRecordHelp = function showRecordHelp() {

				$scope.recording = false;

				if ($scope.mediaRec)
					$scope.mediaRec.pauseRecord();

				$state.go($scope.helpState);
		  }

      $scope.clearCache = function clearCache() {
        clearMediaCache();
      }

      $scope.closeCompletedRethinkModal = function() {

      	// Different from above since we don't want to query for all activities all the time.
			  AccountService.setUserPreference('completed_rethink', 'true');

      	closeModal($scope.completedRethinkModal);

      	$state.go($scope.nextState, {
	  			src: $scope.src,
	  			duration: $scope.elapsedTime
	  		});

	  		$timeout(function() {
	        $rootScope.$broadcast('event:reachedGoal');
	      }, 500);
      }
      
		  $scope.nextStep = function nextStep() {

		  	// Once we go to the next step, we cannot append to the recording anymore.
		  	$scope.mediaRec.stopRecord();

		  	// We clear and release the media because the next step's current position
		  	// isn't working otherwise.
		  	clearMediaCache();

		  	var goToNextState = true;

		  	if ($scope.audioPrefix == 'rethink') {

		  		clearRethinkState();

		  		AccountService.recordActivity('COMPLETED_RETHINK');

		  		var rethinkPref = AccountService.getUserPreference('completed_rethink');
		  		if (!rethinkPref || rethinkPref == 'false') {

		  			goToNextState = false;

		  			$ionicModal.fromTemplateUrl('views/rethink/rethink.completedRethinkModal.html', {
	            scope: $scope,
	            animation: 'slide-in-up'
	          }).then(function(modal) {
	            $scope.completedRethinkModal = modal;

	            openModal($scope.completedRethinkModal);
	          });
		  		}
		  		else {
			  		
			  		$timeout(function() {
			        $rootScope.$broadcast('event:reachedGoal');
			      }, 500);
			  	}

		      // This is also the scenario where we need to post the recordings
		      // to the server.
		      if ($scope.thoughtId) {

				    loadFile($scope.src, function(fileEntry) {

				    	AudioService.addRecording(fileEntry.toURL(), $scope.src, 'analysis', $scope.elapsedTime, $scope.thoughtId);

				    	AudioService.postThought($scope.thoughtId);
				    });
		      }
		  	}

		  	// Check to see if we need to short-circuit the path to inject the help
		  	// state before going to the next step.
		  	if ($state.current.data.nextHelpStatePreference) {

		  		var pref = AccountService.getUserPreference($state.current.data.nextHelpStatePreference);
		  		if (!pref) {

		  			goToNextState = false;
		  			$state.go($state.current.data.nextHelpState, {
		  				src: $scope.src,
		  				duration: $scope.elapsedTime,
		  				intro: true
		  			})
		  		}
		  	}

		  	if (goToNextState) {
		  		$state.go($scope.nextState, {
		  			src: $scope.src,
		  			duration: $scope.elapsedTime
		  		});
		  	}
		  }

		  $scope.getElapsedTime = function getElapsedTime() {
		  	return GeneralService.getTimeDisplay($scope.elapsedTime);
		  }

		  $scope.canRecord = function canRecord() {
		  	return $scope.elapsedTime < $scope.maxTime;
		  }

		  $scope.updateTime = function updateTime() {

		  	if ($scope.recording) {
		  		$scope.elapsedTime += 1;

		  		$scope.mediaRec.__elapsedTime = $scope.elapsedTime;

		  		if ($scope.elapsedTime >= $scope.maxTime) {
		  			$scope.stopRecording();
		  		}
		  		else {
		  			$timeout($scope.updateTime, 1000);
		  		}
		  	}
		  }
		}
	]);


	ctrl.controller('RethinkReplayCtrl', ['$scope', '$state', '$http', '$timeout', '$location', '$stateParams', '$analytics', '$ionicModal', '$ionicPopup', '$ionicLoading', '$ionicNavBarDelegate', 'Environment', 'AudioService', 'GeneralService', 'AccountService',
		function ($scope, $state, $http, $timeout, $location, $stateParams, $analytics, $ionicModal, $ionicPopup, $ionicLoading, $ionicNavBarDelegate, Environment, AudioService, GeneralService, AccountService) {

	    $scope.src = AudioService.getActiveSource();
	    console.log("src: " + $scope.src);

	    $scope.status = 0;

	    // We're going to use the Media plugin to play the audio and keep wavesurfer in 
	    // sync because there seems to be an issue with the webkitAudioContext.
	    // Note that we don't want to destroy this on $destroy because we want the position.
	    // Also, it is in the cache so it'll get cleaned up anyway.

	    loadMedia(Environment, $scope.src, $scope, function statusCallback(status) {

	    	// switch (status) {
	    	// 	case 0: console.log("MEDIA STATUS: NONE"); break;
	    	// 	case 1: console.log("MEDIA STATUS: STARTING"); break;
	    	// 	case 2: console.log("MEDIA STATUS: RUNNING"); break;
	    	// 	case 3: console.log("MEDIA STATUS: PAUSED"); break;
	    	// 	case 4: console.log("MEDIA STATUS: STOPPED"); break;
	    	// 	default: console.log("MEDIA STATUS: ****Bad****");
	    	// }

				$scope.status = status;    	

	    	if (status == Media.MEDIA_RUNNING) {

	    		$scope.playing = true;
	    	}
	    	else {

	    		$scope.playing = false;

	    		if (status == Media.MEDIA_STOPPED) {
	    			$scope.state.finishedPlaying = true;
	    		}
	    	}

	    	// If you click *really* fast you can seem to get this to happen
	    	// in a digest cycle.
	    	if (!$scope.$$phase)
	    		$scope.$apply();
	    });

			$scope.wavesurfer;

			// These states do not need to be preserved.
			$scope.playing = false;
			$scope.loadedData = false;
			$scope.showingHelp = [];
			$scope.showError = false;
			$scope.status; // The media status. 0: None, 1: Starting, 2: Running, 3: Paused, 4: Stopped
			$scope.currentTime = 0.0;

			$scope.duration = $stateParams.duration;

			// This is to manage seeks that are happening as a result of our listening.
			$scope.playSeek = false;

			// Only use with Android when decoding the AMR.
			$scope.loading = false;

			// These are the temporary negative thoughts. They will be copied into the marks
			// when they are finalized.
	    $scope.negativeThoughts = [];
	    $scope.updatingMark = undefined;

	    $scope.performReset = function performReset() {

	    	$scope.state = {
					finishedPlaying: false,
					marks: [],
					position: 0
				}

				if ($scope.wavesurfer) {

					$scope.wavesurfer.clearRegions();
				}
	    }

	    $scope.resetReplay = function resetReplay() {

	    	$analytics.eventTrack('resetReplayPopup', {category: 'thoughts'});

				var confirmPopup = $ionicPopup.confirm({
          // title: 'Alert',
          template: '<div class="thisisatest">Are you sure you want to reset this recording?</div>',
          cancelText: 'CANCEL',
          cancelType: 'button-default',
          okText: 'RESET',
          okType: 'button-default'
        });
        confirmPopup.then(function(res) {

        	if (res) {
	        	$scope.performReset();

        		$analytics.eventTrack('resetReplayConfirm', {category: 'thoughts'});
        	}
        	else {
        		$analytics.eventTrack('resetReplayCancel', {category: 'thoughts'});
        	}
        });
			}

			$scope.performReset();

			// We need to be able to reload the exact state of the page if the user either goes
			// to the help screen or comes back from the next screen. It is likely easiest to
			// do this by storing all of the state we want to regenerate in a single object
			// and serializing it back and forth using JSON.

			
			// Try to load anything from local storage.
			var replayState = localStorage.getItem("rethinkReplayState");
			if (replayState) {
				$scope.state = JSON.parse(replayState);
			}


			$scope.waveform;
			$scope.freqData;
			$scope.waveformData;


	    $ionicModal.fromTemplateUrl('views/rethink/rethink.emotions.html', {
		    scope: $scope,
		    animation: 'slide-in-up'
		  }).then(function(modal) {
		    $scope.modal = modal;
		  });

		  $scope.openEmotionModal = function openEmotionModal() {

	    	if ($scope.playing)
	    		$scope.playPause();

		    $scope.negativeThoughts.length = 0;
		    $scope.showingHelp.length = 0;

			  openModal($scope.modal);
		  };

		  $scope.openModalWithMark = function openModalWithMark(mark) {

	    	if ($scope.playing)
	    		$scope.playPause();

		  	$scope.updatingMark = mark;

		  	$scope.negativeThoughts = mark.tags;
		  	$scope.showingHelp.length = 0;

		  	openModal($scope.modal);
		  };

		  $scope.closeEmotionModal = function closeEmotionModal() {

		  	closeModal($scope.modal);
		  };

		  addBackButtonOverride($ionicPopup, 
		  	                    $ionicNavBarDelegate, 
		  	                    'Are you sure you want to go back? Your recording will be lost.',
		  	                    function onSuccess() {

		  	                    	clearMediaCache();
		  	                    });

			$scope.$on('$destroy', 
		    function() {
		    	
		    	if ($scope.playing)
		    		$scope.playPause();

		    	// We don't want to cache media when we're playing it, only when we're
		    	// recording it. This is because the status won't get updated if we use
		    	// a cached version.
		    	clearMediaCache();

		    	window.backButtonOverride = undefined;

		    	//Cleanup the modal when we're done with it!
		    	$scope.modal.remove();
		    	
	        if ($scope.wavesurfer) {
	        	console.log("destroying wavesurfer");
	        	$scope.wavesurfer.unAll();
	        	// $scope.wavesurfer.destroy();

	        	$scope.wavesurfer = undefined;
	        	window.wavesurfer = undefined;
		      }
		    }
		  );

		  // Execute action on hide modal
		  $scope.$on('modal.hidden', function() {
		    // Execute action
		  });
		  // Execute action on remove modal
		  $scope.$on('modal.removed', function() {
		    // Execute action
		  });

		  $scope.assignThoughts = function assignThoughts(positive) {

		  	// No longer require a thought.
		  	// if (!positive && !$scope.updatingMark && $scope.negativeThoughts.length == 0) {
		  	// 	$scope.showError = true;
		  	// 	return;
		  	// }
		  	// else {
		  	// 	$scope.showError = false;
		  	// }

		  	if (!$scope.updatingMark) {

		  		var color = '#d04b51';
		  		if (positive)
		  			color = '#60d293';

					var wavesurferMark = createMark(color, $scope.currentTime);

		  		var mark = {
		    		tagTime: wavesurferMark.start,
		    		tags: $scope.negativeThoughts.slice(0),
		    		positive: positive ? positive : false
		    	};

		    	$analytics.eventTrack('tagRecording', {category: 'thoughts', label: (positive ? 'positive' : mark.tags.toString()) });

		    	$scope.state.marks.push(mark);
		  	}
		  	else {
		  		// We are allowing the user to remove marks this way.
		  		// No - We now allow the user to enter marks with no thoughts
		  		// associated with them.
		  		// if ($scope.negativeThoughts.length == 0) {

		  		// 	// I think the strategy here will be to remove the mark,
		  		// 	// clear all of the regions from wavesurfer, and readd 
		  		// 	// the remaining ones.
		  		// 	var markIndex = $scope.state.marks.indexOf($scope.updatingMark);
		  		// 	if (markIndex < 0) {
		  		// 		console.log("did not find mark.")
		  		// 	}

		  		// 	$scope.state.marks.splice(markIndex, 1);

		  		// 	$scope.wavesurfer.clearRegions();

		  		// 	addExistingMarks();
		  		// }
		  		// else {
		  			$scope.updatingMark.tags = $scope.negativeThoughts.slice(0);
		  		// }
		  	}
		  	
		  	$scope.updatingMark = undefined;

	    	$scope.negativeThoughts.length = 0;

        $scope.closeEmotionModal();
		  }

		  $scope.setNegativeThought = function setNegativeThought(thought) {

		  	if (!$scope.isSelected(thought))
		  		$scope.negativeThoughts.push(thought);
		  	else {
		  		var index = $scope.negativeThoughts.indexOf(thought);

		  		$scope.negativeThoughts.splice(index, 1);
		  	}
		  }

		  $scope.showReplayHelp = function showReplayHelp(thought) {

		  	if (!$scope.isShowingHelp(thought))
		  		$scope.showingHelp.push(thought);
		  	else {
		  		var index = $scope.showingHelp.indexOf(thought);

		  		$scope.showingHelp.splice(index, 1);
		  	}

		  	event.stopPropagation();
		  	event.preventDefault();
		  }

		  $scope.isSelected = function(thought) {

		  	return $scope.negativeThoughts.indexOf(thought) >= 0;
		  }

		  $scope.isShowingHelp = function(thought) {
		  	return $scope.showingHelp.indexOf(thought) >= 0;
		  }

		  $scope.setPosition = function setPosition(event) {

		  	var x = event.pageX - event.target.offsetLeft;
			
				var loc = x / event.target.offsetWidth;

				if ($scope.wavesurfer) {
					$scope.wavesurfer.seekTo(loc);
					$scope.mediaRec.seekTo(loc * $scope.mediaRec.getDuration() * 1000);
				}
		  }

		  // This isn't the prettiest. There are some issues with audio on the phone, so
		  // we're using the Media object to keep wavesurfer in sync.
		  $scope.monitorPlay = function() {

		  	$scope.mediaRec.getCurrentPosition(function (position) {
		  		var duration = $scope.mediaRec.getDuration();

		  		if (position < 0)
		  			position = 0;

		  		// We get invalid positions back if the media is paused.
		  		if (position == 0 && $scope.status == Media.MEDIA_PAUSED)
		  			return;

		  		$scope.currentTime = position;

		  		$scope.playSeek = true;

		  		if ($scope.wavesurfer)
	  				$scope.wavesurfer.seekTo(position / duration);
			  	
			  	if ($scope.playing) {

			  		$timeout($scope.monitorPlay, 5);
			  	}
		  	});
		  }

	    $scope.playPause = function playPause() {

	    	console.log("playPause. playing: " + $scope.playing);

	    	if ($scope.playing) {

	    		$scope.mediaRec.pause();

	    		$analytics.eventTrack('pausePlayback', {category: 'thoughts'});
	    	}
	    	else {
	    		$scope.mediaRec.play();

	    		$scope.monitorPlay();

	    		$analytics.eventTrack('startPlayback', {category: 'thoughts'});
	    	}

	    	$scope.playing = !$scope.playing;

	    	if ($scope.playing)
	    		$scope.monitorPlay();
	    }

	    function createMark(color, start) {

	    	// Make the mark span 5 pixels. In order to do this correctly, we actually
	    	// need to provide correct multiples of the pixel duration. Such a small
	    	// detail, but I'm in the code...
	    	var elementWidth = angular.element(document.querySelector('#waveform'))[0].offsetWidth;
				var pixelDuration = $scope.mediaRec.getDuration() / elementWidth;

				var newstart = start - (start % pixelDuration);

				return $scope.wavesurfer.addRegion({
					color: color,
					start: start - (pixelDuration * 2),
					end: start + (pixelDuration * 2.9) // Because we don't want it to overlap the next pixel boundary.
				});
	    }

	    function addExistingMarks() {

				for (var i=0; i<$scope.state.marks.length; ++i) {
					
					var mark = $scope.state.marks[i];
					var color = '#d04b51';
		  		if (mark.positive)
		  			color = '#60d293';

						createMark(color, $scope.state.marks[i].tagTime);
				}
	    }

	    $scope.markAudio = function markAudio() {

	    	var closest = getClosestMark();

	    	if (closest)
	    		$scope.openModalWithMark(closest);
	    	else
	    		$scope.openEmotionModal();
	    }

	    $scope.getAudioTime = function getAudioTime() {

	    	if ($scope.loading)
	    		return "Loading...";
	    	
	    	if ($scope.loadedData) {

		    	return GeneralService.getTimeDisplay($scope.currentTime);
		    }
		    
		    return "00:00";
	    }

	    $scope.getMarkCount = function getMarkCount(positive) {

	    	var count = 0;
	    	for (var i=0; i<$scope.state.marks.length; ++i) {

	    		var mark = $scope.state.marks[i];
	    		if (positive && mark.positive)
	    			++count;
	    		else if (!positive && !mark.positive)
	    			++count;
	    	}

	    	return count;
	    }

	    function getClosestMark() {

	    	var minMark;
					
				var time = $scope.currentTime;
				if (time > 0) {

					var duration = $scope.wavesurfer.getDuration();

					var elementWidth = angular.element(document.querySelector('#waveform'))[0].offsetWidth;
					var pixelDuration = duration / elementWidth;

					// We want total size of 20 pixels to be able to click on. So the max offset
					// is what equates to 10 pixels.
					var maxOffset = 10 * pixelDuration;

					var min = Number.MAX_VALUE;
					for (var i=0; i<$scope.state.marks.length; ++i) {

						// If it's within 3 seconds, we'll treat it as a click.
						var mark = $scope.state.marks[i];
						var diff = Math.abs(mark.tagTime - time);

						if (!mark.positive && diff < maxOffset && diff < min) {

							minMark = mark;
							min = diff;
						}
					}
				}

				return minMark;
	    }

			$scope.loadAudio = function loadAudio(src) {


				var fullPath = 'cdvfile://localhost/temporary/' + src;

				// This section works to load the file:
				console.log("loading: " + fullPath);

				var request = new XMLHttpRequest();
				request.open('GET', fullPath, true);

				// If we are using AMR we don't want an array buffer back (I don't think...)
				// if ($scope.src.indexOf(".amr") < 0) {
					request.responseType = "arraybuffer";
				// }

				request.onload = function() {

					console.log("loaded");

					$scope.wavesurfer = Object.create(WaveSurfer);

					window.wavesurfer = $scope.wavesurfer;

					var initParams = {
				    container: document.querySelector('#waveform'),
				    waveColor: '#ccc',
				    progressColor: '#fff',
				    normalize: true,
				    // audioContext: new webkitAudioContext() // This is a hack to workaround what seems to be a bug in wavesurfer.js. Not necessary now that we're playing the audio via Media.
					};

					$scope.wavesurfer.init(initParams);

					// The clicks are a bit too accurate for a phone. We need to find 
					// a bit better way to do it.
					$scope.wavesurfer.on('seek', function(event) {

						if (!$scope.loadedData)
							return;

						// Make sure this isn't the result of the monitor call.
						if ($scope.playSeek) {
							$scope.playSeek = false;
							return;
						}

						$scope.currentTime = event * $scope.mediaRec.getDuration();

						// This has to be the result of a click.
						if ($scope.mediaRec) 
							$scope.mediaRec.seekTo(event * $scope.mediaRec.getDuration() * 1000);

						// It has to be the result of seeking when we start, or when we reach the end.
						if (event == 0)
							return;

						var closest = getClosestMark();

						if (closest) {

							$scope.openModalWithMark(closest);
						}

					})

					var readyAttempts = 0;
					function readyFunc() {

						// The timing here is weird. The media file doesn't have a duration
						// right away, but on Android we need it to initialize the timeline.
						var duration = $scope.mediaRec.getDuration();
						if (duration > 0) {

							// Not sure if this will help the second play issue.
							// $timeout(function() {
								$scope.loadedData = true;

								$scope.wavesurfer.seekTo($scope.state.position / $scope.wavesurfer.getDuration());
								$scope.mediaRec.seekTo($scope.state.position * 1000);

							// }, 1);

							// Go through and set the marks in wavesurfer 
							addExistingMarks();

							console.log("loadedData");

							var timeline = Object.create(WaveSurfer.Timeline);

					    timeline.init({
					        wavesurfer: $scope.wavesurfer,
					        container: '#waveform-timeline',
					        fontFamily: '"Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;',
					        primaryColor: '#ccc',
					        secondaryColor: '#ccc',
					        primaryFontColor: '#ccc',
					        secondaryFontColor: '#ccc',
					        height: 10,
					        duration: $scope.mediaRec.getDuration()
					    });

					    console.log("created timeline");

					    // Now that we have the duration, fire off the upload.
					    if (!$scope.thought) {
					    	$scope.thought = AudioService.createThought();

					    	// Record the state.
					    	AudioService.setActiveThoughtId($scope.thought.id);
						  }

					    addRecording(duration);
					  }
					  else {
					  	// gross. Trying to get the duration to come through on Android.
					  	$scope.mediaRec.play();
					  	$scope.mediaRec.pause();

					  	if (readyAttempts < 5) {

					  		$timeout(readyFunc, 5);

					  		++readyAttempts;
					  	}
					  }
					}

					$scope.wavesurfer.on('ready', function () {

						readyFunc();
					});

					$scope.wavesurfer.on('progress', function(progress) {

						if(!$scope.$$phase) { // don't know why, but we need to check when deployed on ios.
						  $scope.$apply();
						}
					});

					// TODO move this.
					$scope.showHelp = function showHelp() {

				  	if ($scope.playing)
				  		$scope.playPause();

						// Store the location data in local storage in case we come back to this page.
						$scope.state.position = $scope.currentTime;
						localStorage.setItem("rethinkReplayState", JSON.stringify($scope.state));

						$state.go('app.rethink-replay-help');
					}

					$scope.nextStep = function nextStep() {

						// Store the location data in local storage in case we come back to this page.
						$scope.state.position = $scope.currentTime;
						localStorage.setItem("rethinkReplayState", JSON.stringify($scope.state));

						if ($scope.thought)
							AudioService.addTags($scope.thought, $scope.state.marks);

						var pref = AccountService.getUserPreference('completed_rethink_intro_analyze');
						if (!pref) {

							$state.go('app.rethink-analyze-help', {
		  					thoughtId: $scope.thought.id,
		  					intro: true
							});	
						}
						else {
							$state.go('app.rethink-analyze', {
		  					thoughtId: $scope.thought.id
							});
						}
					}

					if (window.webkitAudioContext) {

						// Perform the load.
						$scope.wavesurfer.loadArrayBuffer(request.response);
					}
					else {

						$ionicPopup.alert({
		      		title: '',
		      		template: '<div>Your phone does not support rendering audio.</div>',
		      		okText: 'OK, GOT IT.',
		      		okType: 'button-default'
		      	});
					}
				}

				request.send();

			} // end of loadAudio


			// It seems that the previous controller hasn't had time to finalize the 
			// file that was written out. A simple timeout seems to work.
			$timeout(function() {
				$scope.loadAudio($scope.src);
			}, 1);

	    function addRecording(duration) {

		    loadFile($scope.src, function(fileEntry) {

		    	AudioService.addRecording(fileEntry.toURL(), $scope.src, 'thought', duration, $scope.thought.id);
		    });
			}
		}
	]);

})();