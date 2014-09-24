'use strict';

/**
 * @ngdoc directive
 * @name tipranksDashboardApp.directive:upgradePopup
 * @description
 * # upgradePopup
 */
angular.module('tipranksDashboardApp')
    .directive('upgradePopup', function (AnalyticsService, StateService) {

        return {

            template: '<div ng-if="isActive()" class="type-{{ type }} upgrade-popup bank-hide"><button class="close" ng-click="dismiss()">+</button><button class="upgrade" ng-click="btnFn()" ng-bind="btn"></button><span class="graph-before" ng-bind-html="text"></span></div>',

            restrict: 'E',

            replace: true,

            scope: {
                type: '@'
            },

            controller: function ($scope, storage, $sce, userService, $location) {

                var storageName = 'upgrade-popup-' + $scope.type;

                var text = {
                    'expert': translated('text-expert-cta', '<span style="font-size: 24px;">Check out today\'s <strong>best performing</strong> analyst recommendations</span>'),
                    'stock': translated('upgrade-cta','Upgrade to see the <strong>best performing</strong> analyst consensus and price target.')
                };

                var btn = {
                    'expert': 'see now',
                    'stock': 'upgrade'
                };

                var btnFn = {
                    'expert': function() {
                        $location.path('/ratings');
                        AnalyticsService.report('clicked-see-now-daily-recs-banner');
                    },
                    'stock': function() {
                        promote();
                    }
                };

                $scope.text = $sce.trustAsHtml(text[$scope.type]);
                $scope.btn = $sce.trustAsHtml(btn[$scope.type]);
                $scope.btnFn = btnFn[$scope.type];

                function promote() {
                    StateService.setStorage('lastLockedFeature', 'upgrade-' + StateService.getStorage('lastPage') + '-banner');
                    AnalyticsService.report('clicked-locked-feature');
                    userService.promote(1);
                };

                $scope.dismiss = function() {
                    var dateNow = new Date().getTime();
                    storage.set(storageName, dateNow);
                    AnalyticsService.report('clicked-close-upgade-expert-banner');
                };

                $scope.isActive = function() {
                    var lastDismiss = storage.get(storageName),
                        msInDay = 86400000,
                        days = msInDay * 3,
                        dateNow = new Date().getTime();
                    if (userService.hasPayed() || (!isNaN(lastDismiss) && (dateNow - lastDismiss) <= days)) {
                        // clicked in the past 3 days or a paying user
                        return false;
                    }
                    // not clicked or old click
                    return true;
                };

            },

            link: function(scope) {

                var $view = angular.element(document.querySelector('.' + scope.type + '-view'));

                var toggleViewClass = function() {
                    if (scope.isActive()) {
                        $view.addClass('locked');
                    } else {
                        $view.removeClass('locked');
                    }
                };

                toggleViewClass();
                scope.$watch(function() {
                    return scope.isActive();
                }, function() {
                    toggleViewClass();
                });

            }

        };

    });
