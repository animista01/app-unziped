(function() {

  var ctrl = angular.module('loginCtrl', []);

  var EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  ctrl.controller('LoginCtrl', ['$scope', '$rootScope', '$state', '$timeout', '$ionicPopup', '$ionicLoading', 'authHttp', 'AccountService', 'HabitsService', 'GoalService', 'AudioService', 'PayService', 'NotificationService', 'Environment',
    function ($scope, $rootScope, $state, $timeout, $ionicPopup, $ionicLoading, authHttp, AccountService, HabitsService, GoalService, AudioService, PayService, NotificationService, Environment) {

      // Don't show the keyboard.
      if (window.Keyboard && window.Keyboard.hideFormAccessoryBar)
        Keyboard.hideFormAccessoryBar(true);

      if (window.StatusBar)
        StatusBar.styleDefault();

      $scope.$on('$destroy', function() {
        if (window.StatusBar)
          StatusBar.styleLightContent();
      });

      $scope.loading = false;

      $scope.loginError = false;
      $scope.errorMessage = "";
      $scope.loginData = {};
      $scope.signUpData = {};
      $scope.popup = undefined;

      $scope.resetMode = false;

      $scope.closePopup = function closePopup() {
        if ($scope.popup) {
          $scope.popup.close();
          $scope.popup = undefined;
        }

        // Sometime this doesn't go away.
        if (window.Keyboard)
          window.Keyboard.close();

        window.playVideo();
      }

      $scope.toggleResetMode = function toggleResetMode() {

        $scope.resetMode = !$scope.resetMode;
        $(".resetPasswordButton").text($scope.resetMode ? 'Reset Password' : 'Sign In');

        // This doesn't seem to work quite correctly
        $timeout(function() {
          $("#loginEmail").focus();
          window.Keyboard.show();
        });
      }

      $scope.showLogin = function showLogin() {

        $scope.errorMessage = '';

        window.pauseVideo();

        $scope.popup = $ionicPopup.show({
          template:
            '<a href="javascript:;" ng-click="closePopup()" class="go-back">X</a>' +
            '<form name="loginForm" id="loginForm" ng-submit="login()" >' +
            '<label class="item item-input">' +
              '<input type="email" placeholder="Email" ng-model="loginData.email" name="email" id="loginEmail" tabindex="1" autofocus>' +
            '</label>' +
            '<label class="item item-input" ng-show="!resetMode">' +
              '<input type="password" placeholder="Password" ng-model="loginData.password" tabindex="2" id="loginPassword" name="password">' +
            '</label>' + 
            '<a href="javascript:;" style="padding-left: 15px;" ng-click="toggleResetMode()">{{resetMode ? "Cancel" : "Forgot password?"}}</a>' +
            '<input type="submit" style="visibility:hidden; display: block; padding: 0; margin: 0; height:0; line-height: 0; width: 0;" ng-disabled="loading">' + // Needs to be there for the submit to work
            '</form>' +
            '<div class="error" style="padding-left: 15px;" ng-show="loginError">' +
              '{{errorMessage}}' +
            '</div>',
          title: '',
          scope: $scope,
          buttons: [
            {
              text: '<span class="resetPasswordButton">Sign In</span>',
              type: 'button-default',
              onTap: function(e) {

                if ($scope.resetMode)
                  $scope.resetPassword();
                else
                  $scope.login();

                e.preventDefault();
              }
            },
          ]
        });
      }

      $scope.showTermsOfService = function showTermsOfService() {

        window.open('http://thinkpacifica.com/tos.html', '_blank', 'location=no');
      }

      $scope.showPrivacyPolicy = function showPrivacyPolicy() {

        window.open('http://thinkpacifica.com/privacy.html', '_blank', 'location=no');
      }

      $scope.showCreateUser = function showCreateUser() {
      	
        $scope.errorMessage = '';

        window.pauseVideo();

        $scope.popup = $ionicPopup.show({
          template:
            '<a href="javascript:;" ng-click="closePopup()" class="go-back">X</a>' +
            '<form name="createUserForm" id="createUserForm" ng-submit="createUser()" >' +
            '<label class="item item-input">' +
              '<input type="text" placeholder="Name" ng-model="signUpData.name" tabindex="1" name="name" id="createUserName" autofocus>' +
            '</label>' +
            '<label class="item item-input">' +
              '<input type="email" placeholder="Email" ng-model="signUpData.email" tabindex="3" name="email" id="createUserEmail">' +
            '</label>' +
            '<label class="item item-input password">' +
              '<input type="password" placeholder="Password" ng-model="signUpData.password" tabindex="4" name="password" id="createUserPassword">' +
            '<span>8 characters</span></label>' + 
            '<input type="submit" style="visibility:hidden; display: block; padding: 0; margin: 0; height:0; line-height: 0; width: 0;" ng-disabled="loading">' + // Needs to be there for the submit to work
            '</form>' +
            '<div style="padding-left: 15px;" class="error" ng-show="loginError">' +
              '{{errorMessage}}' +
            '</div>' +
            '<div class="policy">' +
            '<strong>Your account is private and protected.</strong><br>'+
            'By continuing you indicate that you have read and agree to the <a href="javascript:;" ng-click="showTermsOfService()">Terms of Service</a> and <a href="javascript:;" ng-click="showPrivacyPolicy()">Privacy Policy</a>.' + 
            '</div>',
          title: '',
          scope: $scope,
          buttons: [
            {
              text: 'Join Now',
              type: 'button-default',
              onTap: function(e) {

                $scope.createUser();

                e.preventDefault();
              }
            },
          ]
        });
      }

      function checkEmail() {

        if (!$scope.loginData.email) {
          $scope.errorMessage = 'Please enter your email address.';
          
          $timeout(function() {
            $('#loginEmail').focus();  
          });

          return false;
        }
        else if (!EMAIL_REGEX.test($scope.loginData.email)) {

          $scope.errorMessage = 'Please enter a valid email address.';

          $timeout(function() {
            $('#loginEmail').focus();  
          });

          return false;
        }

        return true;
      }

      $scope.resetPassword = function resetPassword() {

        $scope.loginError = false;
        $scope.errorMessage = '';

        var ok = checkEmail();
        if (!ok) {
          $scope.loginError = true;
          return;
        }

        $scope.loading = true;

        $ionicLoading.show({
          template: "Requesting Password Reset..."
        });

        AccountService.resetPassword($scope.loginData.email)
          .success(function() {

            $ionicLoading.hide();

            $scope.loading = false;

            $scope.popup.close();

            var alertPopup = $ionicPopup.alert({
              title: 'Check Email',
              template: '<div class="pw-pop">Please check your email - We sent you a link to reset your password.</div>',
              okText: 'OK, GOT IT.',
              okType: 'button-default'
            });

            playVideo();
          })
          .error(function(data, status, headers, config) { 

            $ionicLoading.hide();

            $scope.loading = false;
            $scope.loginError = true;

            $scope.errorMessage = 'There was a problem resetting your password. Please be sure you have entered the correct email address.';
          });
      }

      $scope.login = function login() {

        $scope.loginError = false;
        $scope.errorMessage = '';

        var ok = checkEmail();
        if (!ok) {
          $scope.loginError = true;
          return;
        }

        else if (!$scope.loginData.password) {
          $scope.errorMessage = 'Please enter your password';
          document.getElementById('loginPassword').focus();
        }

        if ($scope.errorMessage != '') {
          $scope.loginError = true;
          return;
        }
        
        $scope.loading = true;

        $ionicLoading.show({
          template: "Signing In..."
        });

      	AccountService.login($scope.loginData.email, $scope.loginData.password)
      		.success(
            function(data, status, headers, config) {

              // Check to see if the newly logged in user is the same. If not, clear things.
              // This happens when your token expires, or we move server locations (rare in production,
              // not in development).
              //localStorage.clear();

              $ionicLoading.hide();

              $scope.loading = false;
              
              // This is in helpers.js
              initializeUserContext(data, $rootScope, AccountService, HabitsService, GoalService, AudioService, PayService, NotificationService, Environment);

              AccountService.updateToken(headers);
		      
              $state.go('app.home', {} , {location: 'replace'});

              $scope.popup.close();

              playVideo();
  		      }
          ).error(
            function(data, status, headers, config) { 
              
              $ionicLoading.hide();
              
              $scope.loading = false;
              $scope.loginError = true;

              if (status == 401) {
                $scope.errorMessage = 'Incorrect Email or Password';
              }
              else {
                $scope.errorMessage = 'There was an error logging in.';
              }
  		      }
          );
      }

      $scope.createUser = function createUser() {

        $scope.loginError = false;
        $scope.errorMessage = '';

        if (!$scope.signUpData.name) {
          $scope.errorMessage = 'Please enter your name.';
          document.getElementById('createUserName').focus();
        }
        else if (!$scope.signUpData.email) {
          $scope.errorMessage = 'Please enter your email address.';
          document.getElementById('createUserEmail').focus();
        }
        else if (!EMAIL_REGEX.test($scope.signUpData.email)) {

          $scope.errorMessage = 'Please enter a valid email address.';
          document.getElementById('createUserEmail').focus();
        }
        else if (!$scope.signUpData.password) {
          $scope.errorMessage = 'Please enter your password.';
          document.getElementById('createUserPassword').focus();
        }
        else if ($scope.signUpData.password.length < 8) {
          $scope.errorMessage = 'Your password must have 8 characters';
          document.getElementById('createUserPassword').focus();
        }

        if ($scope.errorMessage != '') {
          $scope.loginError = true;
          return;
        }

        $ionicLoading.show({
          template: "Creating New Account..."
        });

        $scope.loading = true;

        AccountService.createAccount($scope.signUpData.email, 
                                     $scope.signUpData.password, 
                                     $scope.signUpData.name)

          .success(function(data, status, headers, config) {

            // Make sure there is no old data in here.
            localStorage.clear();

            $ionicLoading.hide();

            $scope.loading = false;

            // This is in helpers.js
            initializeUserContext(data, $rootScope, AccountService, HabitsService, GoalService, AudioService, PayService, NotificationService, Environment);

            AccountService.updateToken(headers);

            // Go to the index first.
            $state.go('app.nux-intro', {} , {location: 'replace'});


            $scope.popup.close();

            playVideo();

          }).error(function(data, status, headers, config) { 
            
            $ionicLoading.hide();

            $scope.loading = false;
            $scope.loginError = true;

            $scope.errorMessage = 'There was an error creating your user.';
            if (status == 409) {
              $scope.errorMessage = 'The email address is already in use.';
            }

            // var alertPopup = $ionicPopup.alert({
            //   title: 'Error',
            //   template: msg
            // });

            // console.log("error")
          });
      }
    }
  ]);

})();