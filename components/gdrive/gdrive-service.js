'use strict';

var gdriveService = BrowsePassDirectives.service('GoogleDriveService', ['$http', '$timeout', 'DialogService',
    function($http, $timeout, dialogService) {
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

            function onGDriveMetadata(response) {
                if (response.error) {
                    $timeout(function() {
                        errback('metadata', {
                            'response': response
                        });
                    })
                    return;
                }
                var title = response.title;
                var downloadUrl = response.downloadUrl;
                downloadGDriveUrl(title, downloadUrl);
            }

            function downloadGDriveMetadata(fileId) {
                var request = gapi.client.drive.files.get({fileId: fileId});
                request.execute(onGDriveMetadata);
            }

            function pickerCallback(data) {
                if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
                    var doc = data[google.picker.Response.DOCUMENTS][0];
                    var fileId = doc[google.picker.Document.ID];
                    downloadGDriveMetadata(fileId);
                } else if (data[google.picker.Response.ACTION] == google.picker.Action.CANCEL) {
                    $timeout(function() {
                        errback('pick', {
                            'data': data
                        });
                    })
                }
            }

            function createPicker() {
                var docsView = new google.picker.DocsView(google.picker.ViewId.DOCS);
                docsView.setQuery(query);
                docsView.setIncludeFolders(true);
                var pickerBuilder = new google.picker.PickerBuilder().
                    addView(docsView).
                    disableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                    setDeveloperKey(GOOGLE_PUBLIC_API_KEY).
                    setOAuthToken(gapi.auth.getToken().access_token).
                    setCallback(pickerCallback).
                    setTitle('Select a file');
                if (mimetypes) {
                    pickerBuilder.setSelectableMimeTypes(mimetypes.join(','));
                }
                var picker = pickerBuilder.build();
                picker.setVisible(true);
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