'use strict';

// OAuth -- Client ID for web application
var GOOGLE_API_CLIENT_ID = '607316234488-g4drom65gq573ikf163oa2se0jgl6jbk.apps.googleusercontent.com';

var BrowsePassApp = angular.module('BrowsePassApp', [
    'ui.bootstrap',
    'BrowsePassControllers',
    'BrowsePassDirectives',
    'BrowsePassServices',
]);
BrowsePassApp.config(['$compileProvider', '$locationProvider',
    function($compileProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $compileProvider.aHrefSanitizationWhitelist(
            /^\s*(https?|ftp|file|blob):|data:(application\/octet-stream|image\/)/
        );
        $compileProvider.imgSrcSanitizationWhitelist(
            /^\s*(https?|ftp|file|blob):|data:image\//
        );
    }
]);
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

function gapiIsLoaded() {
    if (!(typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime)) {
        gapi.load('auth', {'callback': onGoogleApiLoaded('auth')});
        gapi.load('picker', {'callback': onGoogleApiLoaded('picker')});
        gapi.client.load('drive', 'v2', onGoogleApiLoaded('drive'));
    } else {
        // In Chrome app, emit fake load events.
        onGoogleApiLoaded('auth')();
        onGoogleApiLoaded('picker')();
        onGoogleApiLoaded('drive')();
    }
}
