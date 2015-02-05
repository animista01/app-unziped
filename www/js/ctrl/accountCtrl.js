var ctrl = angular.module('accountCtrl', []);

ctrl.controller('AccountCtrl', ['$scope', '$state', '$http', '$timeout', '$analytics', '$ionicLoading', '$ionicPopup', '$ionicGesture', 'AccountService', 'HabitsService', 'GoalService', 'AudioService', 'PayService', 'Environment', 'Token',
  function ($scope, $state, $http, $timeout, $analytics, $ionicLoading, $ionicPopup, $ionicGesture, AccountService, HabitsService, GoalService, AudioService, PayService, Environment, Token) {

    $scope.user = AccountService.getAccountUser();

    function onSuccess() {

    }

    function onError() {

    }

    // For forcing a receipt refresh.
    var doubleTapGesture;

    // This is a piece of hidden functionality that will force a receipt refresh using iOS
    // in order to find any receipts that we somehow didn't validate correctly.
    function doubleTapRow() {

      if (window.store && AccountService.canUpgrade() && Environment.isIos()) {
       
        $ionicLoading.show({
          template: "Attempting Refresh..."
        });

        window.store.forceRefresh();

        $timeout(function() {
          $ionicLoading.hide();
        }, 2000);
      }
    }

    $scope.$on('$destroy', function() {
      $ionicGesture.off(doubleTapGesture, 'doubletap', doubleTapRow);
    });

    $timeout(function() {
      var elements = document.getElementsByClassName('doubleTap');
      for (var i=0; i<elements.length; ++i) {
        var doubleTapElement = elements[i];
        doubleTapGesture = $ionicGesture.on('doubletap', doubleTapRow, angular.element(doubleTapElement));
      }
    }, 1);

    $scope.sendFeedback = function sendFeedback() {
      window.plugins.socialsharing.shareViaEmail(
  	    '', 
  	    'Pacifica Feedback',
  	    ['info@thinkpacifica.com'], // TO: must be null or an array
  	    null, // CC: must be null or an array
  	    null, // BCC: must be null or an array
  	    null, // FILES: can be null, a string, or an array
  	    onSuccess, // called when sharing worked, but also when the user cancelled sharing via email (I've found no way to detect the difference)
  	    onError // called when sh*t hits the fan
  	  );
    }

    $scope.getAccountType = function getAccountType() {

      var type;
      if (AccountService.isPremiumEnabled()) {
        type = "Full Access - " + $scope.user.account.paymentType;
      }
      else
        type = "Basic";

      return type;
    }

    $scope.getShortTermPrice = function getShortTermPrice() {

      var price = PayService.getShortTermProductPrice();

      return (price && price != 'Uknown') ? '(' + price + ')' : '';
    }

    $scope.isPremium = function isPremium() {

      return AccountService.isPremiumEnabled();
    }

    $scope.getPremiumExpiration = function getPremiumExpiration() {

      return AccountService.getPremiumExpiration();
    }

    $scope.canUpgrade = function canUpgrade() {

      return AccountService.canUpgrade();
    }

    $scope.upgrade = function upgrade() {

      // PayService.purchaseSubscription();

      PayService.showPremiumModal($scope, 'account', 'upgrade', true);
    }

    $scope.goToNotifications = function goToNotifications() {

      $state.go('app.notifications');
    }

    $scope.sharePacifica = function sharePacifica() {

      window.plugins.socialsharing.share('Check out Pacifica', null, null, 'http://thinkpacifica.com');
    }

    $scope.logout = function logout() {

      $ionicLoading.show({
        template: "Signing Out..."
      });

      function finalizeLogout(data, status, headers, config) {

        localStorage.clear();

        // Remove all of the in-memory data as well.
        HabitsService.logout();
        GoalService.logout();
        AudioService.logout();
        Token.clear();

        $state.go('app.login', {} , {location: 'replace'});

        $analytics.eventTrack('logout', {category: 'account'});

        $ionicLoading.hide();
      }

      AccountService.logout()
        .success(finalizeLogout)
        .error(finalizeLogout);
    }

  }
]);