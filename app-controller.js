'use strict';

var appController = BrowsePassControllers.controller('AppController', ['$scope',
    function($scope) {
        $scope.appConfig = {};
        // Should groups be shown? To only display entries, set to false.
        $scope.appConfig.showGroups = false;
    }]);
