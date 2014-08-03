'use strict';

var entryController = BrowsePassControllers.controller('EntryController', ['$scope', 'VaultService',
    function($scope, vaultService) {
        $scope.uuid = null;
        if ($scope.entry != null) {
            $scope.uuid = $scope.entry.uuid;
            $scope.expanded = false;
        }
    }]);