var gdriveController = BrowsePassControllers.controller('GDriveController', ['$scope', '$timeout',
    function($scope, $timeout) {
        $scope.model = {};
        $scope.model.folders = [];
        $scope.model.files = [];
        $scope.model.paths = [
            {id: 'root', path: '<ROOT>'},
        ];
        $scope.model.selectedFile = null;
        $scope.toggleFile = function(file) {
            if ($scope.model.selectedFile == file) {
                $scope.model.selectedFile = null;
            } else {
                $scope.model.selectedFile = file;
            }
        }
        $scope.cancel = function() {
            $scope.$close(null);
        }
        $scope.okay = function() {
            $scope.$close($scope.model.selectedFile);
        }
        $scope.backToParent = function(id) {
            for (var i = 0; i < $scope.model.paths.length; i++) {
                if ($scope.model.paths[i].id == id) {
                    $scope.model.paths.splice(i + 1, $scope.model.paths.length);
                    $scope.search($scope.model.paths);
                }
            }
        }
        $scope.downToChild = function(folder) {
            $scope.model.paths.push({
                id: folder.id, path: folder.title
            });
            $scope.search($scope.model.paths);
        }
        $scope.search = function(paths) {
            function onSearchResult(jsonResponse, rawResponse) {
                if (!jsonResponse || jsonResponse.error) {
                    return;
                }
                $timeout(function() {
                    $scope.model.folders = [];
                    $scope.model.files = [];
                    for (var i = 0; i < jsonResponse.items.length; i++) {
                        var item = jsonResponse.items[i];
                        if (item.mimeType == 'application/vnd.google-apps.folder') {
                            $scope.model.folders.push(item);
                        } else if (item.hasOwnProperty('downloadUrl')) {
                            $scope.model.files.push(item);
                        }
                    }
                    $scope.model.paths = paths;
                    $scope.model.selectedFile = null;
                })
            }
            var lastPath = paths[paths.length - 1];
            var params = {
                fields: 'items(id,downloadUrl,fileExtension,fileSize,mimeType,title)',
                q: '\'' + lastPath.id + '\' in parents and trashed = false',
            };
            gapi.client.request({
                method: 'GET',
                callback: onSearchResult,
                path: '/drive/v2/files',
                params: params,
                // body: ..
            });
        }
        $scope.search($scope.model.paths);
    }])
