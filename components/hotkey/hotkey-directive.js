'use strict';

var dropzoneDirective = BrowsePassDirectives.directive('hotkey', ['$window',
    function($window) {
        return {
            restrict: 'A',
            scope: {
                hotkey: '=',
            },
            link: function(scope, element, attrs) {
                var thisWindow = angular.element($window);
                thisWindow.on('keydown', function(event) {
                    for (var field in scope.hotkey) {
                        if (scope.hotkey[field] != event[field]) {
                            return;
                        }
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    element[0].select();
                });
            },
        }
    }]);