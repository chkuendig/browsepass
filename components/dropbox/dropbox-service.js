'use strict';

var dropboxService = BrowsePassDirectives.service('DropboxService',
    ['$http', '$modal', '$timeout',
    function($http, $modal, $timeout) {
        var service = {};
        service.pickFileAndDownload = function(extensions, callback, errback) {
			
            function downloadDropboxUrl(name, url) {
                $http({
                    method: 'GET',
                    headers: {
                     //   'Authorization': 'Bearer ' + gapi.auth.getToken().access_token,
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

            function pickerCallback(files) {
				var selectedFile = files[0];
                if (selectedFile) {
                    downloadDropboxUrl(selectedFile.name, selectedFile.link);
                } else {
                    errback('pick', {});
                }
            }

          
		var	options = {
			    // Required. Called when a user selects an item in the Chooser.
			    success: pickerCallback,

			    // Optional. Called when the user closes the dialog without selecting a file
			    // and does not include any parameters.
			    cancel: function() {},

			    // Optional. "preview" (default) is a preview link to the document for sharing,
			    // "direct" is an expiring link to download the contents of the file. For more
			    // information about link types, see Link types below.
			    linkType: "direct", // or "direct"

			    // Optional. A value of false (default) limits selection to a single file, while
			    // true enables multiple file selection.
			    multiselect: false, // or true

			    // Optional. This is a list of file extensions. If specified, the user will
			    // only be able to select files with these extensions. You may also specify
			    // file types, such as "video" or "images" in the list. For more information,
			    // see File types below. By default, all extensions are allowed.
			  	 extensions: extensions,
			};
         
			 Dropbox.choose(options);
        }
        return service;
    }]);
