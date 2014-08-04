'use strict';

var dialogService = BrowsePassServices.service('DialogService', ['$modal',
    function($modal) {
        var service = {};
        service.alert = function(caption, message) {
            var modalController = function($scope) {
                $scope.title = caption;
                $scope.body = message;
                $scope.okayButton = 'OK';
                $scope.okay = function() {
                    $scope.$close();
                }
            };
            var modalInstance = $modal.open({
                templateUrl: 'components/dialog/dialog-template.html',
                controller: modalController,
            })
            return modalInstance;
        }
        return service;
    }])