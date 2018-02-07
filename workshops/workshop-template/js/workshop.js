var labGuide = angular.module('labGuide', ['ngMaterial', 'ngSanitize']);

labGuide.config(function ($mdThemingProvider) {
    var whiteBackground = $mdThemingProvider.extendPalette('grey', {
        '50': '#fefefe'
    });
    $mdThemingProvider.definePalette('whiteBackground', whiteBackground);
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange')
        .warnPalette('red')
        .backgroundPalette('whiteBackground');
    $mdThemingProvider.theme('ttc')
        .primaryPalette('blue')
        .accentPalette('light-blue')
        .warnPalette('red')
        .backgroundPalette('whiteBackground');
    $mdThemingProvider.alwaysWatchTheme(true);
});

labGuide.controller('labGuideController', ['$scope', '$http', '$mdSidenav', '$sanitize', '$sce', '$mdDialog'
    , function ($scope, $http, $mdSidenav, $sanitize, $sce, $mdDialog) {
        $scope.theme = 'default';
        $scope.selection = {
            "lab": false
        };
//        READ MANIFEST - THEME, INTERACTIVE, MENU
        $http.get('manifest.json').then(function (res) {
            $scope.version = {};
            $scope.version.selected = 'Instructor Led';
            $scope.manifest = res.data;
            console.log("json",$scope.manifest)
            if($scope.manifest.workshop.interactive){
               $scope.enableInteractive = true;
               $scope.interactive = {
                    src: $scope.manifest.workshop.interactive
                    , title: "Interactive Tour"
                };
            }

            if($scope.manifest.workshop.theme){
                console.log("Theme selected",$scope.manifest.workshop.theme);
                if($scope.manifest.workshop.theme == 'ttc'){
                    $scope.theme = 'ttc';
                }
            }
            $scope.versionsAvailable = [...new Set($scope.manifest.workshop.labs.map(lab => lab.labels && lab.labels.version))].filter(version => version != undefined);
            if($scope.versionsAvailable.length > 1) {
              $scope.version.selected = $scope.versionsAvailable[0];
            }
            $scope.openDialog = function() {
              $mdDialog.show(
                $mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('About Workshop Versions')
                  .textContent('This workshop has multiple versions. You are currently viewing the ' + $scope.version.selected + ' version of the lab guides. You can change the version any time using the selector at the top of the page.')
                  .ariaLabel('Version Dialog')
                  .ok('Done')
                  .openFrom('#version-selector')
                  .closeTo(angular.element(document.querySelector('#version-selector')))
                );
            };
            storage = window.localStorage;
            if(!storage.getItem('dialog-shown') && $scope.versionsAvailable.length > 1) {
              $scope.openDialog();
              storage.setItem('dialog-shown', 'true');
            }


        }, function (msg) {
            console.log('Error getting manifest.json!');
            console.log(msg);
        });
        $scope.trustSrc = function (src) {
            return $sce.trustAsResourceUrl(src);
        }

        $scope.$watch('version', function() {
          if($scope.manifest) {
            var newLab = $scope.manifest.workshop.labs.filter(lab => lab.labels && lab.labels.version == $scope.version.selected && lab.filename.includes("README"))[0]
            $scope.getLabGuide(newLab);
          }
        }, true);

        $scope.loadContent = function (page) {
            $http.get(page).then(function (res) {
              var converter = new showdown.Converter({tables: true})
                , text = res.data;
              converter.setFlavor('github');

              var html = converter.makeHtml(text);
              $scope.htmlContent = html;

              $scope.selection.lab = true;
                $scope.htmlContent = html;
                page.htmlContent = html;
                $scope.selection.lab = true;
                setTimeout(function () {
                    $("#labguide h2").next("h3").addClass("first-in-section");
                    $("#labguide h3").nextUntil("#labguide h1, #labguide h2, #labguide h3").hide();
                    $("#labguide h3").addClass('plus');
                    $("#labguide h3").unbind('click', stepClickHandler);
                    $("#labguide h3").click(stepClickHandler);
                }, 0);
            }, function (msg) {
                if(page === 'Home.md') {
                  console.log('Home.md not found. Displaying README.md...');
                  $scope.getLabGuide({
                    filename: 'README.md'
                  });
                }
                else {
                  console.log('Error getting lab guide markdown!');
                  console.log(msg);
                }
            });
        }
        $scope.getLabGuide = function (lab) {
            if (lab.htmlContent == null) {
                $scope.loadContent(lab.filename);
            }
            else {
                $scope.htmlContent = lab.htmlContent;
                $scope.selection.lab = true;
            }
            setTimeout(function () {
                $("#labguide a").each(function () {
                    if (this.href.endsWith('.md')) {
                        $(this).on("click", function (event) {
                            event.preventDefault();
                            $scope.getLabGuide({
                                filename: this.href
                            });
                        });
                    }
                })
            }, 500);
        }
        stepClickHandler = function (e) {
            var fadeOutStep = function (step) {
                $(step).nextUntil("#labguide h1, #labguide h2, #labguide h3").fadeOut();
                $(step).addClass('plus');
                $(step).removeClass('minus');
            };
            var fadeInStep = function (step) {
                $(step).nextUntil("#labguide h1, #labguide h2, #labguide h3").fadeIn();
                $(step).addClass('minus');
                $(step).removeClass('plus');
            };
            if (e.offsetY < 0) { //user has clicked above the H3, in the expand/collapse all button
                if ($(this).hasClass('first-in-section') && $(this).hasClass('plus')) {
                    fadeInStep($(this));
                    $(this).nextUntil("#labguide h1, #labguide h2", "h3").each(function (i, e) {
                        return fadeInStep(e);
                    });
                }
                else if ($(this).hasClass('first-in-section') && $(this).hasClass('minus')) {
                    fadeOutStep($(this));
                    $(this).nextUntil("#labguide h1, #labguide h2", "h3").each(function (i, e) {
                        return fadeOutStep(e);
                    });
                }
            }
            else { //user has clicked in the H3, only work on this step
                if ($(this).hasClass('plus')) {
                    fadeInStep($(this));
                }
                else if ($(this).hasClass('minus')) {
                    fadeOutStep($(this));
                }
            }
        };

        $scope.toggleLeft = function () {
            $mdSidenav('left').toggle();
        };
        $scope.close = function () {
            $mdSidenav('left').close();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.showInteractive = function (ev) {
            $mdDialog.show({
                contentElement: '#interactiveDialog'
                , parent: angular.element(document.body)
                , targetEvent: ev
                , clickOutsideToClose: true
                , fullscreen: true
            });
        };
        //upon page load, display Home
        $scope.getLabGuide({
            filename: 'Home.md'
        });
    }]);

    labGuide.filter('versionFilter', function() {
      return function(labs, version) {
        if(labs) {
          return labs.filter(lab => lab.labels && lab.labels.version == version);
        }
      }
    });
