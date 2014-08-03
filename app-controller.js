'use strict';

var appController = BrowsePassControllers.controller('AppController', ['$scope', 'VaultService',
    function($scope, vaultService) {
        $scope.appConfig = {};
        // Should groups be shown? To only display entries, set to false.
        $scope.appConfig.showGroups = false;
        $scope.isLoaded = function() {
            return vaultService.isLoaded();
        }
    }]);
