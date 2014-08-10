'use strict';

// OAuth -- Client ID for web application
var GOOGLE_API_CLIENT_ID = '498877584358-u850sitcvk6em4qq7o5o9a2i52b3aofv.apps.googleusercontent.com';
// Public API access -- Key for browser applications
var GOOGLE_PUBLIC_API_KEY = 'AIzaSyDnEug2zqN9DxGozZLb4kMgxFwsq_UivnE';

var BrowsePassApp = angular.module('BrowsePassApp', [
    'ui.bootstrap',
    'BrowsePassControllers',
    'BrowsePassDirectives',
    'BrowsePassServices',
]);
BrowsePassApp.config(function($locationProvider) {
    $locationProvider.html5Mode(true);
})
var BrowsePassControllers = angular.module('BrowsePassControllers', []);
var BrowsePassDirectives = angular.module('BrowsePassDirectives', []);
var BrowsePassServices = angular.module('BrowsePassServices', []);

var GOOGLE_DRIVE_OAUTH_SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
];

function onGoogleApiLoaded(name) {
    function updateAppController() {
        var body = document.querySelector('body');
        var elem = angular.element(body);
        var scope = elem.scope();
        scope.$apply(function($scope) {
            $scope.loadedGoogleApis[name] = true;
        });
    }
    if (name == 'auth') {
        // Pre-authorize to obtain immediately to obtain a token.
        // If this succeeds, gapi.auth.getToken() would return non-null.
        // If it fails, we'll try with immediate=false in the services.
        // The service cannot try BOTH immediate=true, and immediate=false because
        // the click event is only tied to one try. And we do not want the user
        // to click on another button.
        gapi.auth.authorize({
            'client_id': GOOGLE_API_CLIENT_ID,
            'scope': GOOGLE_DRIVE_OAUTH_SCOPES.join(' '),
            'immediate': true,
        }, function() { });
    }
    return updateAppController;
}

function onGoogleApiScriptLoaded() {
    gapi.load('auth', {'callback': onGoogleApiLoaded('auth')});
    gapi.load('picker', {'callback': onGoogleApiLoaded('picker')});
    gapi.client.load('drive', 'v2', onGoogleApiLoaded('drive'));
}
