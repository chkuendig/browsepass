'use strict';

var dropzoneDirective = BrowsePassDirectives.directive('fileDropzone', [
    function() {
        return {
            scope: {
                destination: '=fileDropzone',
            },
            link: function(scope, element, attrs) {
                var ignore = function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                element.on('dragenter dragover', ignore);

                element.on('drop', function(event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var filesArray = null;
                    if (event.type == 'drop') {
                        filesArray = event.dataTransfer.files;
                    }
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