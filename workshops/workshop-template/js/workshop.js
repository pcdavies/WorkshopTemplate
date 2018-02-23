
const primusEndpointUrl = 'https://githubmonitor-derekoneill.uscom-central-1.oraclecloud.com';
const primusJsUrl = 'https://githubmonitor-derekoneill.uscom-central-1.oraclecloud.com/public/primus.js';

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
    $mdThemingProvider.theme('theme-0')
        .primaryPalette('deep-purple')
        .accentPalette('amber')
        .warnPalette('red')
        .backgroundPalette('whiteBackground');
    $mdThemingProvider.theme('theme-1')
        .primaryPalette('light-green')
        .accentPalette('amber')
        .warnPalette('red')
        .backgroundPalette('whiteBackground');
    $mdThemingProvider.theme('theme-2')
        .primaryPalette('amber')
        .accentPalette('blue')
        .warnPalette('brown')
        .backgroundPalette('whiteBackground');
    $mdThemingProvider.alwaysWatchTheme(true);
});

labGuide.controller('ToastCtrl', function($scope, $mdToast) {
  $scope.closeToast = function() {
    $mdToast.hide();
  };
});

labGuide.controller('labGuideController', ['$scope', '$http', '$mdSidenav', '$sanitize', '$sce', '$mdDialog', '$mdToast'
    , function ($scope, $http, $mdSidenav, $sanitize, $sce, $mdDialog, $mdToast) {

      loadScript(primusJsUrl, () => {
        if(typeof Primus !== 'undefined') {
          console.log('Connecting WebSocket...');
          var primus = Primus.connect(primusEndpointUrl);
          if(primus) {
            primus.on('data', function received(data) {
              console.log(data);
              // output.value += data.text +'\n';
              $scope.showCustomToast(data);
            });
            primus.on('open', () =>
              {
                console.log('Location: ' + location.pathname);
                primus.write(location.pathname);
              }
            );
          }
        }
        else {
          console.log('Primus not found. No WebSocket available.');
        }
      });

      function loadScript(url, callback)
      {
          // Adding the script tag to the head as suggested before
          var head = document.getElementsByTagName('head')[0];
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = url;

          // Then bind the event to the callback function.
          // There are several events for cross browser compatibility.
          script.onreadystatechange = callback;
          script.onload = callback;

          // Fire the loading
          head.appendChild(script);
      }

      $scope.toast = $mdToast;
      $scope.toastPromise = {};
      $scope.showCustomToast = function(data) {
        if($scope.selection === 'lab') {
          $mdToast.show({
            hideDelay   : 0,
            position    : 'bottom right',
            scope       : $scope,
            preserveScope : true,
            parent      : document.querySelector('#toastHolder'),
            controllerAs     : 'toast',
            bindToController : true,
            template : '<md-toast> \
                          <span class="md-toast-text">'+ data.text +'</span> \
                          <md-button class="md-highlight" ng-click="refreshLabGuide($event)"> \
                             Reload \
                           </md-button> \
                           <md-button ng-click="closeToast()"> \
                             Close \
                           </md-button> \
                        </md-toast>'
                      }).then(() => console.log('toast closed!'));
          }
        };

        $scope.closeToast = function() {
          $mdToast.hide();
        }

        $scope.refreshLabGuide = function(e) {
          console.log('Refreshing lab guide: ' + $scope.currentFilename);
          if($scope.selection === 'lab') {
            $scope.getLabGuide({ filename: $scope.currentFilename });
          }
          $mdToast.hide();
        };

        $scope.theme = 'default';
        $scope.selection = "";

//        READ MANIFEST - THEME, INTERACTIVE, MENU
        $http.get('manifest.json').then(function (res) {
            $scope.version = {};
            $scope.manifest = res.data;
            // if(typeof primus !== 'undefined') {
            //   primus.write(res.data.workshop.title);
            //   console.log('Sending workshop title to primus: ' + res.data.workshop.title);
            // }
            // $scope.manifest.workshop.labs.unshift({ title: 'Home', description: 'Return to the Workshop Home Page', filename: 'README.md'})
            console.log("json",$scope.manifest)
            if($scope.manifest.workshop.interactive){
               // $scope.enableInteractive = true;
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
            // $scope.versionsAvailable = [...new Set($scope.manifest.workshop.labs.map(lab => lab.labels && lab.labels.version))].filter(version => version != undefined);
            $scope.versionsAvailable = $scope.manifest.workshop.versions;
            $scope.hasMultipleVersions = $scope.versionsAvailable;
            if($scope.hasMultipleVersions) {

              // $scope.version.selected = $scope.versionsAvailable[0];
            }
            $scope.openDialog = function() {
              $mdDialog.show(
                $mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('About Workshop Versions')
                  .textContent('This workshop has multiple versions. You are currently viewing the ' + $scope.version.selected + ' version of the lab guides. You can change the version any time using the selector at the top of the page, or by clicking the home button.')
                  .ariaLabel('Version Dialog')
                  .ok('Done')
                  .openFrom('#version-selector')
                  .closeTo(angular.element(document.querySelector('#version-selector')))
                );
            };
            // storage = window.localStorage;
            // if(!storage.getItem('dialog-shown') && $scope.versionsAvailable.length > 1) {
            //   $scope.openDialog();
            //   storage.setItem('dialog-shown', 'true');
            // }

            if($scope.hasMultipleVersions) {
              console.log('Workshop has multiple versions');
              $scope.selection = "chooseVersion";
            }
            else {
              //upon manifest load, display Home
              $scope.currentFilename = "Home.md";
              $scope.getLabGuide({
                  filename: 'Home.md'
              });
            }

        }, function (msg) {
            console.log('Error getting manifest.json!');
            console.log(msg);
        });
        $scope.trustSrc = function (src) {
            return $sce.trustAsResourceUrl(src);
        }

        $scope.$watch('version.selected', function() {
          if($scope.manifest && undefined != typeof $scope.version.selected) {
            // $scope.version.selected = $scope.version.name;
            var themeNumber = $scope.versionsAvailable.findIndex(elem => elem.name === $scope.version.selected);
            if(themeNumber >= 0) {
              $scope.theme = 'theme-' + themeNumber;
            }
            else $scope.theme = 'default';

            // $scope.selectVersion($scope.version, );
            var newLab = $scope.manifest.workshop.labs.filter(lab => lab.labels && lab.labels.version == $scope.version.selected )[0];
            var filename = ""; //"Home.md";
            if(newLab) {
                filename = newLab.filename;
            }
            if(filename != "") {
              $scope.previousSelection = $scope.selection;
              $scope.selection = "lab";
              $scope.currentFilename = filename;
              $scope.getLabGuide({ filename: filename});
            }
            else {
              $scope.currentFilename = "";
              $scope.previousSelection = $scope.selection;
              $scope.selection = "chooseVersion";
              $scope.version.selected = undefined;
            }
          }
        }, true);


        $scope.showHomeOrVersionSelectPage = function() {
          if($scope.hasMultipleVersions) {
            $scope.previousSelection = $scope.selection;
            $scope.selection = "chooseVersion";
            $scope.currentFilename = '';
            $scope.version.selected = undefined;
          }
          else {
            $scope.currentFilename = "Home.md";
            $scope.getLabGuide({
                filename: 'Home.md'
            });
          }
        };

        $scope.showOrHideInteractiveTour = function() {
          if($scope.selection == 'interactive') {
            $scope.selection = $scope.previousSelection;
            $scope.previousSelection = 'interactive';
          }
          else {
            $scope.previousSelection = $scope.selection;
            $scope.selection = 'interactive';
          }
        };

        $scope.loadContent = function (page) {
            console.log('Loading page: ' + page);
            $http.get(page).then(function (res) {
              console.log('Got page: ' + page);
              var converter = new showdown.Converter({tables: true})
                , text = res.data;
              converter.setFlavor('github');

              var html = converter.makeHtml(text);

              $scope.htmlContent = html;
              $scope.selection = 'lab';
              page.htmlContent = html;
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
                  $scope.currentFilename = "README.md";
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
            $scope.currentFilename = lab.filename;
            $scope.loadContent(lab.filename);

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

    }]);

    labGuide.filter('versionFilter', function() {
      return function(labs, version) {
        if(labs && version) {
          return labs.filter(lab => lab.labels && lab.labels.version == version);
        }
        else return labs;
      }
    });
