var servicesModule = angular.module('audioService', []);

servicesModule.factory('AudioService', ['$rootScope', '$timeout', 'authHttp', 'Token', 'Environment', 'GeneralService', 
	function($rootScope, $timeout, authHttp, Token, Environment, GeneralService) {

		var audioService = {

			audioContext: {},

			activeThoughtId: undefined,
			activeSource: undefined,
		};

		audioService.setActiveThoughtId = function setActiveThoughtId(thoughtId) {
			audioService.activeThoughtId = thoughtId;
		}

		audioService.getActiveThoughtId = function getActiveThoughtId() {
			return audioService.activeThoughtId;
		}

		audioService.setActiveSource = function setActiveSource(src) {
			audioService.activeSource = src;
		}

		audioService.getActiveSource = function getActiveSource() {
			return audioService.activeSource;
		}

		var localAudioContext = localStorage.getItem('audioContext');
		if (localAudioContext) {
			audioService.audioContext = JSON.parse(localAudioContext);
		}

		function updateLocalContext() {

			localStorage.setItem('audioContext', JSON.stringify(audioService.audioContext));
		}

		audioService.setAudioContext = function setAudioContext(ctx) {

			audioService.audioContext = ctx;
			updateLocalContext();
		}

		audioService.logout = function logout() {
			audioService.audioContext = {};
		}
		
		audioService.getThoughts = function getThoughts() {

			return audioService.audioContext.thoughts;
		}

		// We don't currently handle offline goals. They are stored here 
		// as you go through the steps, but if they don't get persisted
		// at the end, they will get cleared.
		audioService.clearNonPersistedGoals = function clearNonPersistedGoals() {

			for (var i=audioService.audioContext.thoughts.length-1; i>=0; --i) {

				var thought = audioService.audioContext.thoughts[i];
				if (!isNumeric(thought.id) && !thought.saving) {

					audioService.audioContext.thoughts.splice(i, 1);
				}
			}

			updateLocalContext();
		}

		audioService.getThought = function getThought(thoughtId) {

			for (var i=0; i<audioService.audioContext.thoughts.length; ++i) {
				var thought = audioService.audioContext.thoughts[i];

				if (thought.id == thoughtId || thought.generatedId == thoughtId)
					return thought;
			}
		}

		audioService.createThought = function createThought() {

			// Clear these since we don't want to mess up the numbering.
			audioService.clearNonPersistedGoals();

			var titleRegex = /Thought\sRecord\s[0-9]*/;

			var maxId = 0;

			// Go through and find the thought with the maximum number.
			for (var i=0; i<audioService.audioContext.thoughts.length; ++i) {

				var thoughtTitle = audioService.audioContext.thoughts[i].title;
				if (titleRegex.test(thoughtTitle)) {

					var pieces = thoughtTitle.split(" ");

					// We could end up with a blank one in the middle. I think from
					// legacy thoughts that had a bad name generation.
					var id = parseInt(pieces[pieces.length-1]);
					if (id > maxId)
						maxId = id;
				}
			}

			var newTitle = "Thought Record " + (maxId + 1);

			var newThought = {
				id: generateGUID(),
				title: newTitle,
				createdAt: new Date().getTime(),
				createdAtString: new Date().toString(),
				recordings: {}
			}

			audioService.audioContext.thoughts.push(newThought);

			return newThought;
		}

		audioService.addRecording = function addRecording(localUrl, filename, type, duration, thoughtId) {

			// Add the audio recording to the local set.
			var newRecording = {
				id: generateGUID(),
				title: filename,
				type: type,
				duration: duration,
				recordedAt: new Date().getTime(),
				recordedAtString: new Date().toString(),
				localUrl: localUrl,
				url: filename // So that it can reload it locally without needing the secure URL.
			}

			var thought = audioService.getThought(thoughtId);

			thought.recordings[type] = newRecording;

			return newRecording;
		}

		audioService.addTags = function addTags(thought, marks) {

			var recording = thought.recordings['thought']; // Looks weird. Thought happened to be the type name

		  var tagsToSubmit = [];

			for (var i=0; i<marks.length; ++i) {

				var mark = marks[i];

				tagsToSubmit.push({
					// recordingId: recording.id, // We don't know the recording ID yet.
					tagTypeString: mark.positive ? 'positive' : 'negative',
					tagTime: mark.tagTime,
					tagString: mark.tags.join(',')
				});
			}

			if (recording.tags)
				Array.prototype.push.apply(recording.tags, tagsToSubmit);
			else
				recording.tags = tagsToSubmit;
		}


		function postTags(recording) {

			if (recording.tags) {

				for (var i=0; i<recording.tags.length; ++i) {

					recording.tags[i].recordingId = recording.id;
				}
				return authHttp.post(Environment.serverURL + '/audio/tag', {
					tags: recording.tags
				});			
			}
		}

		function postRecording(recording, thoughtId) {


			// TODO This is just copied. Need the data out of the recording.

			var win = function (r) {
		    console.log("Code = " + r.responseCode);
		    console.log("Response = " + r.response); // This should be the recordingId
		    console.log("Sent = " + r.bytesSent);

		    recording.id = +r.response;

		    postTags(recording);
			}

			var fail = function (error) {
		    alert("An error has occurred: Code = " + error.code);
		    console.log("upload error source " + error.source);
		    console.log("upload error target " + error.target);
			}

    	console.log("got fileEntry for upload");

    	var options = new FileUploadOptions();
	    options.fileKey = 'file';
	    options.fileName = recording.title;
	    options.mimeType = recording.title.endsWith('.mp4') ? 'audio/mp4' : 'audio/amr'; // TODO Better handling?


			var params = {};
			params.title = recording.title;
			params.type = recording.type;
			params.duration = recording.duration;
			params.thoughtId = thoughtId;

			options.params = params;


			// Add the session header so that the request will be authenticated.
			var headers = {
				Session: Token.getToken()
			};

			options.headers = headers;


			console.log("uploading local url : " + recording.localUrl);

			if (Environment.isOnline()) {
				if (window.FileTransfer) {
					var ft = new FileTransfer();
					ft.upload(recording.localUrl, encodeURI(Environment.serverURL + '/audio/upload'), win, fail, options);
				}
				else {
					console.log("WARNING: Can not upload file.");
				}
			}
			else {
				console.log("Cannot handle offline upload yet.");
			}
		}

		audioService.postThought = function postThought(thoughtId) {

			// Record that we are saving the thought so that it is not
			// removed.
			var thought = audioService.getThought(thoughtId);
			thought.saving = true;

			authHttp.post(Environment.serverURL + '/audio/createThought', thought.title)
				.success(function(id) {

					thought.generatedId = thought.id;
					thought.id = id;

					// updateLocalContext();

					// Now that we have a thoughtId, upload the recordings.
					for (var key in thought.recordings) {

						var recording = thought.recordings[key];

						postRecording(recording, thought.id);
					}

				});
		}

		audioService.archiveThought = function archiveThought(thoughtId) {

			for (var i=0; i<audioService.audioContext.thoughts.length; ++i) {

				var thought = audioService.audioContext.thoughts[i];
				if (thought.id == thoughtId) {

					audioService.audioContext.thoughts.splice(i, 1);

					authHttp.post(Environment.serverURL + '/audio/archiveThought', thoughtId)
						.error(function(data, status, headers, config) {

			        console.log("Error archiving thought: " + data);
			      });

					break;
				}
			}
		}

		audioService.updateThoughtTitle = function updateThoughtTitle(thoughtId, title) {

			for (var i=0; i<audioService.audioContext.thoughts.length; ++i) {

				var thought = audioService.audioContext.thoughts[i];
				if (thought.id == thoughtId) {

					thought.title = title;

					updateLocalContext();

					authHttp.post(Environment.serverURL + '/audio/updateThoughtTitle', {
						thoughtId: thoughtId,
						title: title
					});

					break;
				}
			}
		}

		return audioService;

	}
]);