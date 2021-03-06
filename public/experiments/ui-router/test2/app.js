(function () {
    angular
        .module('splitApp', ['ui.router'])
        .config(configuration);
    
    function configuration($stateProvider, $urlRouterProvider) {
        var states = [
            {
                name: 'a',
                url: '/a',
                views: {
                     'a': {templateUrl: 'a.html'}
                }
            }
            ,{
                name: 'a.b',
                url: '/b',
                views: {
                    'a': {templateUrl: 'b.html'}
                }
            }
            ,{
                name: 'a.b.c',
                url: '/c',
                views: {
                    'a': {templateUrl: 'c.html'}
                }
            }
        ];
        states.forEach(function (state) {
            $stateProvider.state(state);
        });

        $urlRouterProvider.otherwise('/a');
    }
})();