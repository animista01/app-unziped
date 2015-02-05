function initializeUserContext(userContext, $rootScope, AccountService, HabitsService, GoalService, AudioService, PayService, NotificationService, Environment) {
	AccountService.setAccountUser(userContext.accountUser);
  AccountService.setUserPreferences(userContext.userPreferences);
  AccountService.setActivityContext(userContext.activityContext);
  HabitsService.setHabitContext(userContext.habitContext);
  HabitsService.setPotentialAccountHabits(userContext.potentialHabits);
  GoalService.setGoalContext(userContext.goalContext);
  AudioService.setAudioContext(userContext.thoughtContext);

  $rootScope.$broadcast('event:userContextInitialized');
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
  };
}

if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

// IE8...
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    'use strict';
    if (this == null) {
      throw new TypeError();
    }
    var n, k, t = Object(this),
        len = t.length >>> 0;

    if (len === 0) {
      return -1;
    }
    n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    for (k = n >= 0 ? n : Math.max(len - Math.abs(n), 0); k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}

function isAlphaNumeric(str) {
  var regex = /^[a-z0-9]+$/i;
  
  return regex.test(str); 
}

function isNumeric(str) {
  var regex = /^[0-9]+$/i;
  
  return regex.test(str); 
}

function getQueryStringParam(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function capitaliseFirstLetter(string) {
	
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}


var months = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  3: 'Apr',
  4: 'May',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sep',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec'
}

function getMonthAbbrev(index) {
  return months[index];
}

function dayDiff(first, second) {
    return (second-first)/(1000*60*60*24);
}

Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

function openModal(modal) {
        
  if (window.StatusBar)
    StatusBar.styleDefault();

  modal.show();
};

function closeModal(modal) {

  if (window.StatusBar)
    StatusBar.styleLightContent();

   modal.hide();
}

