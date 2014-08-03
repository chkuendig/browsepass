'use strict';

var groupController = BrowsePassControllers.controller('GroupController', ['$scope', 'VaultService',
    function($scope, vaultService) {
        $scope.uuid = null;
        if ($scope.group != null) {
            $scope.uuid = $scope.group.uuid;
        }
        $scope.reload = function() {
            $scope.groups = vaultService.getGroups($scope.uuid);
            $scope.entries = vaultService.getEntries($scope.uuid);
        }
        $scope.$on('dataChanged', function() {
            $scope.reload();
        });
        $scope.reload();
    }]);