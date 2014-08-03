'use strict';

var BrowsePassApp = angular.module('BrowsePassApp', [
    'ui.bootstrap',
    'BrowsePassControllers',
    'BrowsePassDirectives',
    'BrowsePassServices',
]);
var BrowsePassControllers = angular.module('BrowsePassControllers', []);
var BrowsePassDirectives = angular.module('BrowsePassDirectives', []);
var BrowsePassServices = angular.module('BrowsePassServices', []);