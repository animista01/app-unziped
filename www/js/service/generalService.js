var servicesModule = angular.module('generalService', []);


servicesModule.factory('GeneralService', ['Environment', function(Environment) {

	var MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

	var generalService = {

		COLORS: ['#60d293', '#5fe9c4', '#5bdddf', '#58caf6', '#ffbe66', '#ff9b73', '#ff6669'],

		COLOR_NAMES: ['green', 'turquoise', 'cyan', 'blue', 'yellow', 'orange', 'red']
	}


	generalService.getColor = function getColor(colorName) {

		if (!colorName)
			colorName = generalService.COLOR_NAMES[0];

		// always default to green if there isn't one.
	  colorName = colorName.toLowerCase();

	  var index = generalService.COLOR_NAMES.indexOf(colorName);
	  if (index >=0)
	  	return generalService.COLORS[index];

	  return generalService.COLORS[0];
	}

	generalService.getDifferenceInDays = function getDifferenceInDays(d1, d2) {

		var diff = Math.abs(d2 - d1);

		return Math.floor(diff / MILLISECONDS_IN_DAY);
	}

	generalService.getTodayString = function getTodayString() {
		var d = new Date();
		return generalService.getDayString(d);
	}

	// This is used for data representations, not for general display
	generalService.getDayString = function getDayString(d) {
		var currDate = d.getDate();
		var currMonth = d.getMonth() + 1;
		var currYear = d.getFullYear();

		return currYear + '-' + 
					 (currMonth < 10 ? '0' : '') + currMonth + '-' + 
		       (currDate < 10 ? '0' : '') + currDate;
	}

	// Use this for displaying to the screen.
	generalService.getDateDisplay = function getDateDisplay(date) {

    var year = '' + date.getFullYear();
    year = year.substring(2);

		return (date.getMonth()+1) + '/' + date.getDate() + '/' + year;
	}

	generalService.getMinuteDisplay = function getMinuteDisplay(d) {

		var minute = d.getMinutes();
		var hour = d.getHours();

		var hourDisplay = hour;
		if (hourDisplay == 0)
			hourDisplay = 12;
		else if (hourDisplay > 12)
			hourDisplay = hourDisplay - 12;

		return hourDisplay + ":" + (minute < 10 ? '0' : '') + minute + (hour >= 12 ? 'PM' : 'AM');
	}

	generalService.toTitleCase = function toTitleCase(str) {

	    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	}


	function getTimePortionDisplay(time) {

		if (!time)
			return "00";
		else if (time < 10)
			return "0" + time;
		else
			return "" + time;
	}

	generalService.getTimeDisplay = function getTimeDisplay(elapsed) {

		var minutes = Math.floor(elapsed / 60);

		var seconds = Math.floor(elapsed - (minutes * 60));

		var minuteDisplay = getTimePortionDisplay(minutes);
		var secondDisplay = getTimePortionDisplay(seconds);

		return minuteDisplay + ":" + secondDisplay;
	}

	generalService.loadFile = function loadFile(src, callback) {
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

	return generalService;

}]);