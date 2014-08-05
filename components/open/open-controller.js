'use strict';

var openController = BrowsePassControllers.controller('OpenController', ['$scope', '$http', '$location', 'DialogService', 'VaultService',
    function($scope, $http, $location, dialogService, vaultService) {
        $scope.clear = function() {
            $scope.sources = {};
            $scope.sources.file = {};
            $scope.sources.gdrive = {};
            $scope.sources.url = $location.hash();
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
            if (newValue != oldValue && newValue.hasOwnProperty('name')) {
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
                if (key == '') {
                    dialogService.alert('BrowsePass', 'Please supply a password, or a key file, or both, to open the vault.');
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
            if ($scope.selectedSource == 'URL') {
                loadUrl();
            } else if ($scope.selectedSource == 'File' || $scope.selectedSource == 'GDrive') {
                var stream = $scope.sources[$scope.selectedSource.toLowerCase()].data;
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

        $scope.openGDrive = function() {
            if (!$scope.canOpenGDrive()) { // This function is in AppController.
                dialogService.alert('BrowsePass', 'Google Drive API has not been loaded yet. ' +
                    'Please try again in a moment.');
                return;
            }

            function downloadGDriveUrl(name, url) {
                $http({
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
                    },
                    cache: false,
                    url: url,
                    responseType: 'arraybuffer'}).
                    success(function(data, status, headers, config) {
                        $scope.sources.gdrive.name = name;
                        $scope.sources.gdrive.data = data;
                        $scope.selectedSource = 'GDrive';
                    }).error(function(data, status, headers, config) {
                        dialogService.alert('BrowsePass', 'The selected Google Drive file cannot be reached. ' +
                            'This might be an intermitten issue. Please try again in a moment.');
                    });
            }

            function onGDriveMetadata(data) {
                var title = data.title;
                var downloadUrl = data.downloadUrl;
                downloadGDriveUrl(title, downloadUrl);
            }

            function downloadGDriveFile(fileId) {
                var request = gapi.client.drive.files.get({fileId: fileId});
                request.execute(onGDriveMetadata);
            }

            function pickerCallback(data) {
                if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                    var doc = data[google.picker.Response.DOCUMENTS][0];
                    var fileId = doc[google.picker.Document.ID];
                    downloadGDriveFile(fileId);
                }
            }

            function createPicker() {
                var MIME_TYPES = ['application/vnd.google.drive.ext-type.kdbx', 'application/octet-stream'];
                var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS);
                docsView.setQuery('*.kdbx');
                docsView.setIncludeFolders(true);
                var picker = new google.picker.PickerBuilder().
                    addView(docsView).
                    disableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                    setDeveloperKey(GOOGLE_PUBLIC_API_KEY).
                    setOAuthToken(gapi.auth.getToken().access_token).
                    setSelectableMimeTypes(MIME_TYPES.join(',')).
                    setCallback(pickerCallback).
                    setTitle('Select a KDBX file').
                    build();
                picker.setVisible(true);
            }

            function handleAuthResult(immediate) {
                function actualHandleAuthResult(authResult) {
                    if (authResult && !authResult.error) {
                        createPicker();
                    } else if (immediate) {
                        // The immediate authorize call failed. Try non-immediate.
                        gapi.auth.authorize(
                            {
                                'client_id': GOOGLE_API_CLIENT_ID,
                                'scope': GOOGLE_DRIVE_OAUTH_SCOPES.join(' '),
                                'immediate': false,
                            },
                            handleAuthResult(false)
                        );
                    } else {
                        dialogService.alert('BrowsePass', 'In order to open files in Google Drive, ' +
                            'you must grant Google Drive access to BrowsePass.');
                    }
                }
                return actualHandleAuthResult;
            }

            gapi.auth.authorize(
                {
                    'client_id': GOOGLE_API_CLIENT_ID,
                    'scope': GOOGLE_DRIVE_OAUTH_SCOPES.join(' '),
                    'immediate': true,
                },
                handleAuthResult(true)
            );
        }
    }]);
