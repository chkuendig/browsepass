'use strict';

var dropzoneDirective = BrowsePassDirectives.directive('fileReceiver', [
    function() {
        return {
            scope: {
                destination: '=fileReceiver',
            },
            link: function(scope, element, attrs) {
                element.on('change', function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var filesArray = filesArray = event.target.files;
                    if (filesArray.length > 0) {
                        var file = filesArray[0];
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            scope.$apply(function() {
                                scope.destination.data = e.target.result;
                                scope.destination.name = file.name;
                            })
                        };
                        reader.onerror = function(e) {
                            // TODO XXX FIXME: handle this
                        };
                        reader.readAsArrayBuffer(file);
                    }
                })
            },
        }
    }]);