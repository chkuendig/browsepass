'use strict';

var fieldRendererDirective = BrowsePassDirectives.directive('fieldRenderer', ['$timeout', '$window',
    function($timeout, $window) {
        return {
            restrict: 'A',
            scope: {
                field: '=fieldRenderer'
            },
            templateUrl: 'components/field/field-template.html',
            link: function(scope, element, attrs) {
                scope.masked = scope.field['protected'];
                scope.unmask = function() {
                    scope.masked = !scope.masked;
                    // Wait for the hidden text to display first, then select it.
                    $timeout(function() {
                        scope.select();
                    }, 100);
                    // Remember to hide the text again after timeout
                    $timeout(function() {
                        scope.masked = !scope.masked;
                    }, 10000);
                }
                scope.select = function() {
                    var selectElem = element.children()[1].children[0];
                    var range = $window.document.createRange();
                    range.selectNodeContents(selectElem);
                    var selection = $window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            },
        }
    }]);
