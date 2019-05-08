/**
 * @description concept selector directive
 * @author Manjunath Davanam <manjunathd@ilimi.in>
 */

formApp.directive('optionsselector', function() {
    const manifest = org.ekstep.pluginframework.pluginManager.getPluginManifest("org.ekstep.metadata");

    var conceptController = ['$scope', '$rootScope', '$controller', function($scope, $rootScope, $controller) {
        var selectedConcepts = [];
        $scope.contentMeta = $scope.$parent.contentMeta;
        $scope.conceptSelectorMessage = $scope.contentMeta.prerequiste ? '(' + $scope.contentMeta.prerequiste.length + ') prerequiste selected' : '(0) prerequiste selected'
        $scope.fieldConfig = $scope.config;
        if ($scope.contentMeta.prerequiste) {
            if ($scope.contentMeta.prerequiste.length)
                _.forEach($scope.contentMeta.prerequiste, function(concept) {
                    selectedConcepts.push(concept.identifier);
                });
        }
        $scope.templateId = (!_.isUndefined($scope.$parent.$parent.tempalteName)) ? $scope.$parent.$parent.tempalteName : 'metaform';
        $scope.conceptElementId = $scope.templateId + '-concept';
        $scope.invokeConceptSelector = function() {
            ecEditor.addEventListener('editor.concept.change', $scope.resetConcepts, this);
            ecEditor.dispatchEvent('org.ekstep.optionsselector:init', {
                element: $scope.conceptElementId,
                selectedConcepts: selectedConcepts,
                callback: $scope.callbackFn
            });
        }
        $scope.callbackFn = function(data) {
            console.log("Length", data)
            $scope.conceptSelectorMessage = '(' + data.length + ') prerequiste selected';
            $scope.contentMeta.prerequiste = _.map(data, function(concept) {
                return {
                    "identifier": concept.id,
                    "name": concept.name
                };
            });
            ecEditor.dispatchEvent('editor:form:change', {key: 'prerequiste', value: $scope.contentMeta.prerequiste, templateId: $scope.templateId});
            $rootScope.$safeApply();
        }
        $scope.resetConcepts = function(event, data){
            if(data.key == 'prerequiste' && data.value.length == 0){
                $scope.conceptSelectorMessage = '(0) prerequisited selected';
                $scope.contentMeta.prerequiste = [];

                ecEditor.dispatchEvent('org.ekstep.optionsselector:init', {
                    element: $scope.conceptElementId,
                    selectedConcepts: [],
                    callback: $scope.callbackFn
                });
                $rootScope.$safeApply();
            }    
        }
        $scope.invokeConceptSelector()
    }]
    return {
        restrict: "EA",
        templateUrl: ecEditor.resolvePluginResource(manifest.id, manifest.ver, "editor/directives/optionsselector/template.html"),
        controller: conceptController,
        scope: {
            config: '='
        },
        transclude: true

    };
});

//# sourceURL=optionsDirective.js