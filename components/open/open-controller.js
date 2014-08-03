'use strict';

var openController = BrowsePassControllers.controller('OpenController', ['$scope', '$http', 'VaultService',
    function($scope, $http, vaultService) {
        $scope.clear = function() {
            $scope.sources = {};
            $scope.sources.file = {};
            $scope.sources.url = '';
            $scope.selectedSource = null;

            $scope.credentials = {};
            $scope.credentials.password = '';
            $scope.credentials.file = {};
            $scope.selectedCredentials = {};
        }

        $scope.clear();

        $scope.$watch('sources.file', function(newValue, oldValue) {
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
                $scope.selectedSource = 'File';
            }
        }, true);

        $scope.$watch('sources.url', function(newValue, oldValue) {
            if (newValue != oldValue) {
                $scope.selectedSource = 'URL';
            }
            if ($scope.sources.url.trim().length == 0) {
                $scope.selectedSource = null;
            }
        });

        $scope.$watch('credentials.password', function(newValue, oldValue) {
            if (newValue != oldValue) {
                $scope.selectedCredentials.password = newValue.length > 0;
            }
        });

        $scope.$watch('credentials.file', function(newValue, oldValue) {
            if (newValue != oldValue) {
                $scope.selectedCredentials.file = true;
            }
        }, true);

        $scope.loaded = false;
        $scope.loading = false;

        $scope.load = function() {
            if ($scope.loaded || $scope.loading) {
                return;
            }
            $scope.loading = true;
            function loadStream(stream) {
                var key = '';
                if ($scope.selectedCredentials.password) {
                    key += readPassword($scope.credentials.password);
                }
                if ($scope.selectedCredentials.file) {
                    var keystream = $scope.credentials.file.data
                    keystream = new jDataView(keystream, 0, keystream.byteLength, true);
                    key += readKeyFile(keystream);
                }
                try {
                    vaultService.load(stream, key);
                    $scope.loaded = true;
                    $scope.clear();
                } catch (ex) {
                    // TODO FIXME handle this
                }
                $scope.loading = false;
            }
            function loadUrl() {
                $http({
                    method: 'GET',
                    cache: false,
                    url: $scope.sources.url,
                    responseType: 'arraybuffer',
                    withCredentials: true}).
                    success(function(data, status, headers, config) {
                        var stream = new jDataView(data, 0, data.byteLength, true);
                        loadStream(stream);
                    }).error(function(data, status, headers, config) {
                        // TODO XXX FIXME handle this
                        $scope.loading = false;
                    });
            }
            if ($scope.selectedSource == 'URL') {
                loadUrl();
            } else if ($scope.selectedSource == 'File') {
                var stream = $scope.sources.file.data;
                stream = new jDataView(stream, 0, stream.byteLength, true);
                loadStream(stream);
            } else {
                // TODO XXX Handle this
                $scope.loading = false;
            }
        }
        $scope.unload = function() {
            vaultService.unload();
            $scope.loaded = false;
        }
    }]);
