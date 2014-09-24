'use strict';

angular.module('tipranksDashboardApp')
    .controller('StocksCtrl', function($scope, BusinessRules, Stocks, ControlFiltersFactory, userService, $timeout, AnalyticsService, $rootScope) {

        $rootScope.seoTitle = translated("seo-title",'Stocks Recommended by Top Ranked Analysts | TipRanks');
        $rootScope.seoDescription = 'Review the top stocks recommended by best performing analysts from across the web.';

        var source = {};

        $scope.isLoading = false;
        function getData() {
            $scope.isLoading = true;
            Stocks.getStocks($scope).then(function(res) {
                $scope.sectors = res.data.sectors;
                source.stocks = res.data.stocks;
                filterStocks();
                $scope.isLoading = false;
                var timeout = 1000, delay = 0;
                angular.forEach($scope.sectors, function(sector) {
                    delay += 100;
                    $timeout(function() {
                        sector.buyPercentStyle = sector.buyPercent + '%';
                        sector.holdPercentStyle = sector.holdPercent + '%';
                        sector.sellPercentStyle = sector.sellPercent + '%';
                    }, timeout + delay);
                });
            });
        }

        // get utilities
        $scope.user = userService;

        // get settings, watch it and update page for the first time
        $scope.settings = ControlFiltersFactory.list;
        var oldSettings = $scope.settings.changed;
        $scope.$watch('settings.changed', function() {
            if (oldSettings !== $scope.settings.changed) {
                getData();
            }
        });
        getData();

        $scope.report = function(analytics) {
            AnalyticsService.report(analytics);
        };

        $scope.filters = ['positionWC', 'mktCap', 'sectors'];
        $scope.criterias = BusinessRules.getCriterias($scope.filters);
        $scope.handleCheckboxChange = function(criteria, option) {
            if (option.isAll) {
                toggleAll(criteria.options, option.val);
                return;
            }
            if (!option.val) {
                uncheckAllOption(criteria.options);
            }
            filterStocks();
            AnalyticsService.report(getStateString(option.val) + '-settings-' + criteria.name.replace(' ', '-') + '-most-recommended', {
                option: option.name
            });
        };

        $scope.handleRadioChange = function(criteria, option) {
            filterStocks();
            AnalyticsService.report(getStateString(option.val) + '-settings-' + criteria.name.replace(' ', '-') + '-most-recommended', {
                option: option.name
            });
        }

        function getStateString(val) {
            return val ? 'checked' : 'unchecked';
        }

        function toggleAll(options, val) {
            angular.forEach(options, function(option) {
                if (!option.isAll) {
                    option.val = val;
                }
            });
            filterStocks();
            AnalyticsService.report(getStateString(val) + '-settings-sectors-most-recommended', {
                option: 'allSectors'
            });
        }

        function uncheckAllOption(options) {
            angular.forEach(options, function(option) {
                if (option.isAll) {
                    option.val = false;
                }
            });
        }

        function checkPosition(rating) {
            return $scope.criterias.positionWC.modelName == rating;
        };

        function checkSector(sector) {
            var val;
            angular.forEach($scope.criterias.sectors.options, function(option) {
                if (option.modelName == sector) {
                    val = option.val;
                }
            });
            return val;
        };

        function checkMKTCap(mktCap) {
            var val;
            angular.forEach($scope.criterias.mktCap.options, function(option) {
                if (option.modelName == mktCap) {
                    val = option.val;
                }
            });
            return val
        };

        function filterStocks() {
            if (source.stocks) {
                BusinessRules.syncCriterias();
                $scope.stocks = source.stocks.filter(function(stock) {
                    var isByPosition = checkPosition(stock.rating);
                    var isByMKTCap = checkMKTCap(BusinessRules.normaliseMktCap(parseInt(stock.mktCap)));
                    var isBySector = checkSector(stock.sector);
                    return isByPosition && isByMKTCap && isBySector;
                });
            }
        }

        $scope.abs = function(str) {
            return str.toString().replace('-', '');
        }

    });
