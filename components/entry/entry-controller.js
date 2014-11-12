'use strict';

var entryController = BrowsePassControllers.controller('EntryController', ['$scope', 'VaultService',
    function($scope, vaultService) {
        $scope.uuid = null;
        if ($scope.entry != null) {
            $scope.uuid = $scope.entry.uuid;
            $scope.expanded = false;
        }
        $scope.getFields = function(standard) {
            var standardNames = ["Title", "UserName", "Password", "URL", "Notes"];
            var fields = [];
            if (standard) {
                for (var i = 0; i < standardNames.length; i++) {
                    var name = standardNames[i];
                    if ($scope.entry.fields.hasOwnProperty(name)) {
                        fields.push($scope.entry.fields[name]);
                    }
                }
            } else {
                for (var i in $scope.entry.fields) {
                    var field = $scope.entry.fields[i];
                    if (standardNames.indexOf(field.name) < 0) {
                        fields.push(field);
                    }
                }
            }
            return fields;
        }
        $scope.hasBinary = function() {
            for (var _ in $scope.entry.binaries) {
                return true;
            }
            return false;
        }
    }]);