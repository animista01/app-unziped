
// Provide a way to override the back button.
window.backButtonOverride = undefined;


// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('pacifica', 
  ['ionic',
   'angulartics',
   'angulartics.google.analytics.cordova',
   'tokenProvider',
   'nuxCtrl',
   'helpCtrl',
   'homeCtrl',
   'progressCtrl',
   'accountCtrl',
   'breatheCtrl',
   'habitsCtrl',
   'loginCtrl',
   'rethinkCtrl',
   'goalsCtrl',
   'notificationCtrl',
   'environmentService',
   'generalService',
   'mediaService',
   'authService',
   'accountService',
   'goalService',
   'habitsService',
   'audioService',
   'errorService',
   'notificationService',
   'payService',
   'pacificaDirectives']
)

.config(['$stateProvider', '$urlRouterProvider', '$logProvider', '$locationProvider', '$analyticsProvider', 'TokenProvider', 'googleAnalyticsCordovaProvider',
  function($stateProvider, $urlRouterProvider, $logProvider, $locationProvider, $analyticsProvider, TokenProvider, googleAnalyticsCordovaProvider) {

    // TODO fix.
    googleAnalyticsCordovaProvider.trackingId = 'UA-55091509-4';
    googleAnalyticsCordovaProvider.period = 10; // default: 10 (in seconds)
    googleAnalyticsCordovaProvider.debug = true; // default: false

    $logProvider.debugEnabled(true);

    $analyticsProvider.virtualPageviews(false);

    // These are just separated out into app.routes.js.
    initializeRoutes($stateProvider);

    // Check to see where we should start the user off. We do this because checking
    // once we're in the controller means that the html for that controller has already
    // loaded. We want the first screen to be the one determined below. We do not
    // want a transition when the app loads.
    if (TokenProvider.isTokenValid()) {
    
      // TODO Probably need a UserPreferenceProvider
      var preferences = localStorage.getItem("userPreferences")
      if (preferences != null && preferences != '') {

        var prefObj = JSON.parse(preferences);

        var nuxState = prefObj["last_nux_state"];

        if ((!nuxState) || nuxState == '' || nuxState != 'completed') {

          if ((!nuxState) || nuxState == '' || nuxState == 'app.nux-intro')
            $urlRouterProvider.otherwise("/app/nux");
          // else if (nuxState == 'app.nux-anxious')
          //   $urlRouterProvider.otherwise("/app/nux/anxious");
          // else if (nuxState == 'app.nux-worry')
          //   $urlRouterProvider.otherwise("/app/nux/worry");
          // else if (nuxState == 'app.nux-anxiety')
          //   $urlRouterProvider.otherwise("/app/nux/anxiety");
          else if (nuxState == 'app.nux-goal')
            $urlRouterProvider.otherwise("/app/nux/goal?nux=true&nextState=app.nux-activities");
          else if (nuxState == 'app.nux-activities')
            $urlRouterProvider.otherwise("/app/nux/activities");
          else
            $urlRouterProvider.otherwise("/app/home");
        }
        else {
          $urlRouterProvider.otherwise("/app/home"); 
        }
      }
    }
    else {
      $urlRouterProvider.otherwise("/app/login");
    }
  }
])

.controller('AppCtrl', ['$scope', '$rootScope', '$state', '$http', '$timeout', '$analytics', '$ionicModal', '$ionicPopup', '$ionicPlatform', '$ionicNavBarDelegate', '$ionicSideMenuDelegate', 'Environment', 'ErrorService', 'AccountService', 'HabitsService', 'MediaService', 'GoalService', 'AudioService', 'NotificationService', 'PayService',
               function($scope, $rootScope, $state, $http, $timeout, $analytics, $ionicModal, $ionicPopup, $ionicPlatform, $ionicNavBarDelegate, $ionicSideMenuDelegate, Environment, ErrorService, AccountService, HabitsService, MediaService, GoalService, AudioService, NotificationService, PayService) {

  window.handleOpenURL = function handleOpenURL(url) {

    console.log("Got url: " + url);
  }

  if (Environment.isDebug()) {
    
    // Debugging
    window.onerror = function(msg, url, line) {
      
      console.log("JS Error:");
      console.log(msg);

      alert("ERROR:" + msg + "\nurl: " + url + "\nline: " + line);

      AccountService.postJSError(msg, url, line);
    };
  }
  else {

    // Post to the server.
    window.onerror = function(msg, url, line) {

      console.log("JS Error:");
      console.log(msg);

      AccountService.postJSError(msg, url, line);
    };
  }

  // Rewire the ionic popup so that we can control the status bar color.
  function rewireIonicPopup(func) {

    var ionicFunc = $ionicPopup[func];
    $ionicPopup[func] = function(options) {

      if (window.StatusBar)
        StatusBar.styleDefault();

      var promise = ionicFunc(options);

      promise.then(function() {

        if (window.StatusBar)
          StatusBar.styleLightContent();
      });

      return promise;
    }
  }

  rewireIonicPopup('show');
  rewireIonicPopup('alert');
  rewireIonicPopup('confirm');
  rewireIonicPopup('prompt');
  

  $scope.serverError = false;

  $scope.downloadedFile = false;

  var video = document.getElementById('bgvid');

  // Load the file from the local assets. This is a bit gross, but we don't have
  // access to this otherwise, from what I can tell.
  window.loadVidFromAssets = function loadVidFromAssets(src) {

    var assetUrl = 'http://s3-us-west-1.amazonaws.com/pacificalabs-prod/app/back3.mp4'; //cordova.file.applicationDirectory + 'www/img/' + src;
    //var localUrl = "cdvfile://localhost/persistent/" + src;

    var filePath = cordova.file.dataDirectory + src;

    var ft = new FileTransfer();
    ft.download(assetUrl, filePath, function(entry) {
        console.log("download complete: ");
        console.log(entry);

        $scope.downloadedFile = true;

        // This works when you relaunch the app
        video.src = entry.nativeURL;

        $("#bgvid").show();

        playVideo();

        hideSplashScreen();

      },
      function(error) {
        console.log("download error source " + error.source);
        console.log("download error target " + error.target);
        console.log("upload error code" + error.code);
      }
    );
  }

  // Load the file from persistent storage.
  window.loadVidFile = function loadVidFile(src) {

    function onFileSystemSuccess(fileSystem) {

      // Need to create file to record to it.
      fileSystem.root.getFile(src, {}, 
        function onGetSucceed(fileEntry) {
          console.log("got file entry:");
          console.log(fileEntry);

          video.src = fileEntry.nativeURL;

          $("#bgvid").show();

          playVideo();

          hideSplashScreen();
        }, 
        function onGetFail(error) {
          console.log("could not load file: ");
          console.log(error);

          loadVidFromAssets(src);
        }
      );
    }

    function fail() {
      console.log("failed getting filesystem");
    }

    if (window.LocalFileSystem && Environment.isAndroid())
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
  }

  window.resolveVidFile = function resolveVidFile(src) {

    var path = cordova.file.dataDirectory + src;

    function onResolveSuccess() {
      console.log("Found local file: " + src);

      video.src = path;

      playVideo();

      hideSplashScreen();
    }

    function onResolveFail() {
      console.log("Could not resolve local file: " + src);

      // Hide the video. We'll redisplay it when we get it.
      $("#bgvid").hide();

      hideSplashScreen();

      loadVidFile(src);
    }


    window.resolveLocalFileSystemURI(path, onResolveSuccess, onResolveFail);
  }

  $scope.closeProgressIntroModal = function closeProgressIntroModal() {

    AccountService.setUserPreference('viewed_progress_popup', 'true');

    closeModal($scope.progressIntroModal);
  }

  function checkForProgressModal() {
    var progressPref = AccountService.getUserPreference('viewed_progress_popup');
    if (!progressPref && AccountService.isProgressEnabled()) {

      $ionicModal.fromTemplateUrl('views/progress/progress.introModal.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function(modal) {
          $scope.progressIntroModal = modal;

          openModal($scope.progressIntroModal);
        });
    }
  }

  $rootScope.$on('event:userContextInitialized', function() {

    if (window.Crittercism && Environment && !Environment.isDebug()) {

      window.Crittercism.setUsername('' + userContext.accountUser.user.id);
    }

    // This needs to happen either on login or app load, if they're already logged in.
    if (window.plugins && window.plugins.pushNotification) {
      window.pushNotification = window.plugins.pushNotification;

      NotificationService.registerNotifications();
    }

    // Tnis needs to happen here because new receipts need to get validated once the user is logged in.
    PayService.initStore();

    checkForProgressModal();
  });

  /*************************************************************************
   * Retrieve the current user context. This is where the app context
   * gets initialized if it is not loaded from local storage (offline mode).
   *************************************************************************/

  function retrieveUserContext() {
    $scope.loadingUserContext = true;

    console.log("retrieving user context.");

    AccountService.findUserContext()
      .success(function (data) {

        console.log("got user context:")
        console.log(data);

        // This is in helpers.js
        initializeUserContext(data, $rootScope, AccountService, HabitsService, GoalService, AudioService, PayService, NotificationService, Environment);

        $scope.loadingUserContext = false;
      })
      .error(function(data, status, headers, config) { 
        // Handle the error
        console.log("error loading user context");

        $scope.loadingUserContext = false;

      });
  }

  window.playVideo = function() {
    if (video && video.paused && ($state.includes('app.home') || $state.includes('app.login'))) {
      video.play();

      if (Environment.isAndroid()) {

        // This is the same chck that we see in the stateChangeSuccess listener.
        // It is here because closing the app and reopening doesn't fire a state
        // change, but we will get a resume event.
        if (!video.paused) {
          $("#bgimg").hide();
          $("#bgimgblur").hide();
        }
      }
    }
  }

  // Every once in a while we're going to check to see if the video is not playing and it should
  // be and start it (the playVideo function checks the paused values). This fixes an issue where
  // opening the tray on ios causes the video to pause.
  // Note that we don't want to do this with a directive because it can cause a lot of digests.
  setInterval(playVideo, 500);

  window.pauseVideo = function() {
    if (video)
      video.pause();
  }
  
  $scope.errorService = ErrorService;

  $scope.goBack = function goBack() {

    if (window.backButtonOverride) {
      window.backButtonOverride();
    }
    else {
      history.go(-1);
      
      // This seems to create circular references.
      // $ionicNavBarDelegate.back();
    }
  }


  $scope.$on("$stateChangeSuccess", 
    function(event, toState, toParams, fromState, fromParams) {

      var body = angular.element(document.querySelector("body"));
      var oldName = fromState.name.replace('.','-');
      body.removeClass(oldName);
      var newName = toState.name.replace('.','-');
      body.addClass(newName);

      // Just disable this for now. We can reenable it easily if we want.
      $ionicSideMenuDelegate.canDragContent(false);

      $analytics.pageTrack(toState.url);

      if (toState.name == 'app.home' || toState.name == 'app.login' || toState.name == 'app.nux-activities') {

        if (video && video.paused) {
          
          video.play();

          // In the case where Android doesn't know how to play the video initially, we need to
          // put up an image (the poster tag doesn't work well either). Then if playing it actually
          // works, we can remove it.
          if (Environment.isAndroid()) {

            // If we tried to play it and it is still paused, we'll use the bgimg.
            if (!video.paused) {
              $("#bgimg").hide();
              $("#bgimgblur").hide();
            }
            else {
              $("#bgimg").show();
              $("#bgimgblur").hide();
            }
          }
        }
      }
      else {
        if (video && !video.paused)
          video.pause();

        // Android can't display the blur filter eiter.
        if (Environment.isAndroid()) {
          $("#bgimgblur").show();
          $("#bgimg").hide();
        }
      }
    }
  );

  // This section is duplicated from habits. Should probably be moved elsewhere. 
  var hasMedia = false;
  var goalAudio;
  
  function hideSplashScreen() {

    if (Environment.isIos())
      $("#bgimg").remove();

    // Try to wait for the view to actually display.
    setTimeout(function() {
      
      if (navigator && navigator.splashscreen) {
        navigator.splashscreen.hide();
      }

      if (window.StatusBar)
        StatusBar.styleLightContent();
    }, 1000);
  }

  // Must wait for the device here or window.Media may not be there.
  $ionicPlatform.ready(function() {

    // Retrieve the user context. To be safe, make sure everything is initialized first.
    // It seems there are a few issues if you try to do this right away when the app 
    // is loading.
    retrieveUserContext();

    if (Environment.isAndroid()) {
      resolveVidFile('back3.mp4');
    }
    else {
      hideSplashScreen();
    }

    // The cordova keyboard plugin is available at window.Keyboard. The Ionic Keyboard
    // plugin is available at corodva.plugins.Keyboard. Make them available the same way.
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      window.Keyboard = window.cordova.plugins.Keyboard;

      window.Keyboard.close();
    }

    var hasMedia = MediaService.isNative();

    goalAudio = MediaService.loadMedia('img/goal.mp3', 'goalAudio');
    MediaService.setVolume(goalAudio, 0.1);

  });

  $scope.$on("event:reachedGoal", function() {

    MediaService.replayMedia(goalAudio);
  });

  // This does not ever get called.
  $scope.$on('$destroy', function destroyCtrl() {

    if (hasMedia) {

      goalAudio.stop();
      goalAudio.release();
    }
    else {
      goalAudio.pause();
    }
  });

  document.addEventListener("resume", function() {

    console.log("resume app");

    if (AccountService.getAccountUser().user) {

      // Tnis needs to happen every once a while in order to refresh the store. 
      PayService.refreshStore();
    }

    playVideo();

  }, false);
  
  // Handle redirect for loginRequired events.
  $scope.$on('event:loginRequired', 
    function() { 

      // Clear out any user preferences.
      localStorage.clear();

      $state.go('app.login', {} , {location: 'replace'});
    }
  );

  $scope.$on('event:online',
    function() {

      $scope.serverError = false;

      $scope.$apply();
    });

  $scope.$on('event:offline',
    function() {

      $scope.serverError = true;

      $scope.$apply();
    });

  $scope.reconnect = function reconnect() {
    retrieveUserContext();
  }

  $scope.showMenu = function showMenu() {
    return !$state.includes('app.login') && !$state.includes('app.newUser'); 
  }
}]);
