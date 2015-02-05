var mod = angular.module('mediaService', []);

/*
 * This service is designed to handle local media. There are a few cross-platform
 * quirks that we want to centralize so that we don't need to handle the same
 * thing all over the place.
 */
mod.factory('MediaService', ['Environment', function(Environment) {

	var mediaService = {};

	var playOptions = { playAudioWhenScreenIsLocked : false };

	mediaService.isNative = function isNative() {
		return typeof window.Media != 'undefined';
	}

	// src here is intended to be the www-relative source. So if something is in
	// www/img/goal.mp3, the source should be img/goal.mp3
	mediaService.loadMedia = function loadMedia(src, elementId, statusCallback) {

		var prefix = '';
		if (!src.startsWith('http') && window.device && window.device.platform && window.device.platform.toLowerCase() == 'android') {
			prefix = '/android_asset/www/';  
		}

		if (window.Media) {
			return new Media(prefix + src, 
				function getMediaSuccess() {

					console.log("Loaded Media: " + src);
				},
				function getMediaFailure() {

					console.log("Failed Loading Media: " + src);
				},
				statusCallback);
		}
		else if (elementId) {

			var el = document.getElementById(elementId);

			el.src = src;

			return el;
		}
	}

	mediaService.setVolume = function setVolume(media, volume) {
		if (media.setVolume) {
			media.setVolume(volume);
		}
		else {
			media.volume = volume;
		}
	}

	mediaService.replayMedia = function replayMedia(media, options) {

		if (!mediaService.isNative()) {
			
      media.load();
      media.play();
		}
		else {

			if (!options)
				options = playOptions;

			media.play(options);	
		}
	}

	return mediaService;

}]);