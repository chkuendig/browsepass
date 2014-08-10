'use strict';

var openController = BrowsePassControllers.controller('OpenController',
    ['$scope', '$http', '$location', 'DialogService', 'GoogleDriveService', 'VaultService',
    function($scope, $http, $location, dialogService, gdriveService, vaultService) {
        $scope.clear = function() {
            $scope.sources = {};
            $scope.sources.file = {};
            $scope.sources.gdrive = {};
            $scope.sources.url = $location.hash();
            $scope.selected = {};
            $scope.selected.source = null;

            $scope.credentials = {};
            $scope.credentials.password = '';
            $scope.credentials.file = {};
            $scope.credentials.gdrive = {};
            $scope.selected.credentials = {};
        }

        $scope.clear();

        $scope.$watch('sources.gdrive', function(newValue, oldValue) {
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
                $scope.selected.source = 'GDrive';
            }
        }, true);
        $scope.$watch('sources.file', function(newValue, oldValue) {
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
                $scope.selected.source = 'File';
            }
        }, true);

        $scope.$watch('sources.url', function(newValue, oldValue) {
            if (newValue != oldValue) {
                $scope.selected.source = 'URL';
            }
            if ($scope.sources.url.trim().length == 0) {
                $scope.selected.source = null;
            }
        });

        $scope.$watch('credentials.password', function(newValue, oldValue) {
            if (newValue != oldValue) {
                $scope.selected.credentials.password = newValue.length > 0;
            }
        });
        $scope.$watch('credentials.gdrive', function(newValue, oldValue) {
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
                $scope.selected.credentials.gdrive = true;
            }
        }, true);
        $scope.$watch('credentials.file', function(newValue, oldValue) {
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
                $scope.selected.credentials.file = true;
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
                if ($scope.selected.credentials.password) {
                    key += readPassword($scope.credentials.password);
                }
                if ($scope.selected.credentials.gdrive) {
                    var keystream = $scope.credentials.gdrive.data;
                    keystream = new jDataView(keystream, 0, keystream.byteLength, true);
                    key += readKeyFile(keystream);
                }
                if ($scope.selected.credentials.file) {
                    var keystream = $scope.credentials.file.data;
                    keystream = new jDataView(keystream, 0, keystream.byteLength, true);
                    key += readKeyFile(keystream);
                }
                if (key == '') {
                    dialogService.alert('BrowsePass', 'Please supply at least a password, or a key file to open the vault.');
                    $scope.loading = false;
                    return;
                }
                try {
                    vaultService.load(stream, key);
                    $scope.loaded = true;
                    $scope.clear();
                } catch (ex) {
                    dialogService.alert('BrowsePass', ex);
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
                        if (status == 404) {
                            dialogService.alert('BrowsePass', 'The provided URL is not found.');
                        } else {
                            dialogService.alert('BrowsePass', 'The provided URL cannot be reached. ' +
                                'This is often due to insufficient cross origin resource sharing policy.');
                        }
                        $scope.loading = false;
                    });
            }
            if ($scope.selected.source == 'URL') {
                loadUrl();
            } else if ($scope.selected.source == 'File' || $scope.selected.source == 'GDrive') {
                var stream = $scope.sources[$scope.selected.source.toLowerCase()].data;
                stream = new jDataView(stream, 0, stream.byteLength, true);
                loadStream(stream);
            } else {
                dialogService.alert('BrowsePass',
                    'Please specify the vault. ' +
                    'You can enter a URL, or drag and drop a local file in.');
                $scope.loading = false;
            }
        }
        $scope.unload = function() {
            vaultService.unload();
            $scope.loaded = false;
        }

        $scope.openGDrive = function(destination, mimetypes, query) {
            if (!$scope.canOpenGDrive()) { // This function is in AppController.
                dialogService.alert('BrowsePass', 'Google Drive API has not been loaded yet. ' +
                    'Please try again in a moment.');
                return;
            }
            gdriveService.pickFileAndDownload(
                mimetypes, query,
                function(name, data, status, headers, config) {
                    destination.name = name;
                    destination.data = data;
                },
                function(type, response) {
                    if (type == 'data' || type == 'metadata') {
                        dialogService.alert('BrowsePass', 'The selected Google Drive file cannot be reached. ' +
                            'This might be an intermitten issue. Please try again in a moment.');
                    } else if (type == 'auth') {
                        dialogService.alert('BrowsePass', 'In order to open files in Google Drive, ' +
                            'you must grant BrowsePass permission to access Google Drive.')
                    }
                }
            );
        }
        $scope.openGDriveKdbx = function(destination) {
            $scope.openGDrive(
                destination,
                ['application/vnd.google.drive.ext-type.kdbx', 'application/octet-stream'],
                '*.kdbx'
            );
        }
        $scope.openGDriveAll = function(destination) {
            $scope.openGDrive(destination, null, null);
        }
    }]);
