'use strict';

var gdriveService = BrowsePassDirectives.service('GoogleDriveService',
    ['$http', '$modal', '$timeout',
    function($http, $modal, $timeout) {
        var service = {};
        service.pickFileAndDownload = function(mimetypes, query, callback, errback) {
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
                        $timeout(function() {
                            callback(name, data, status, headers, config);
                        })
                    }).error(function(data, status, headers, config) {
                        $timeout(function() {
                            errback('data', {
                                'name': name,
                                'data': data,
                                'status': status,
                                'headers': headers,
                                'config': config
                            });
                        })
                    });
            }

            function pickerCallback(selectedFile) {
                if (selectedFile) {
                    downloadGDriveUrl(selectedFile.title, selectedFile.downloadUrl);
                } else {
                    errback('pick', {});
                }
            }

            function createPicker() {
                var picker = $modal.open({
                    templateUrl: 'components/gdrive/gdrive-picker-template.html',
                });
                picker.result.then(pickerCallback);
            }

            function handleAuthResultWithImmediate(immediate) {
                function handleAuthResult(authResult) {
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
                            handleAuthResultWithImmediate(false)
                        );
                    } else {
                        $timeout(function() {
                            errback('auth', {
                                'response': authResult
                            });
                        })
                    }
                }
                return handleAuthResult;
            }

            var immediate = true;
            if (!gapi.auth.getToken()) {
                immediate = false;
            }
            gapi.auth.authorize(
                {
                    'client_id': GOOGLE_API_CLIENT_ID,
                    'scope': GOOGLE_DRIVE_OAUTH_SCOPES.join(' '),
                    'immediate': immediate,
                },
                handleAuthResultWithImmediate(true)
            );
        }
        return service;
    }]);
