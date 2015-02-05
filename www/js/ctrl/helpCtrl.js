var ctrl = angular.module('helpCtrl', []);

// This is the generic help controller, which handles the status bar styling
// and retrieving the intro parameter.
ctrl.controller('HelpCtrl', ['$scope', '$state', '$http', '$stateParams', 'AccountService',
  function ($scope, $state, $http, $stateParams, AccountService) {

    if (window.StatusBar)
      StatusBar.styleDefault();

    $scope.$on('$destroy', function() {
      if (window.StatusBar)
        StatusBar.styleLightContent();
    });

    $scope.intro = false;
    if ($stateParams.intro)
      $scope.intro = $stateParams.intro;
  }
]);