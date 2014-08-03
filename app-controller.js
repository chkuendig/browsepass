'use strict';

var appController = BrowsePassControllers.controller('AppController', ['$scope', 'VaultService',
    function($scope, vaultService) {
        $scope.appConfig = {};
        // Should groups be shown? To only display entries, set to false.
        $scope.appConfig.showGroups = false;
        // Search term to filter the list.
        $scope.appConfig.filter = '';
        $scope.isLoaded = function() {
            return vaultService.isLoaded();
        }
        $scope.$watch('appConfig.showGroups', function(newValue, oldValue) {
            if (newValue == true) {
                $scope.appConfig.filter = '';
            }
        });
        $scope.$watch('appConfig.filter', function(newValue, oldValue) {
            if (newValue.length > 0) {
                $scope.appConfig.showGroups = false;
            }
        });
    }]);
