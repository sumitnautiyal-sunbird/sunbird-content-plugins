/**
 * Plugin to add questions in question set
 * @class QuestionFormController
 * Swati singh <Swati.singh@tarento.com>
 */
'use strict';
angular.module('createquestionapp', [])
  .controller('QuestionFormController', ['$scope', 'pluginInstance', function($scope, pluginInstance) {

    $scope.currentUserId = ecEditor._.isUndefined(ctrl.context) ? '' : (ctrl.context.uid || ctrl.context.user.id);
    $scope.isQuestionTab = true;
    $scope.selectedQuestions = [];
    $scope.showConfigForm = false;
    $scope.isQuestionSetConfig = false;
    $scope.selQuestionObj = {};
    $scope.filterObj = {};
    $scope.questions = [];
    $scope.unselectedQuestions = [];
    $scope.itemRange = [];
    $scope.Totalconcepts;
    $scope.selectedConceptsData;
    $scope.grades;
    $scope.languages;
    $scope.difficultyLevels = ['Easy', 'Medium', 'Difficult'];
    $scope.questionTypes = ['mcq', 'ftb', 'mtf'];
    $scope.filterObj = {};
    $scope.selectedIndex;
    $scope.conceptsText = '(0) Concepts';
    $scope.pluginIdObj = {
      "question_set_id": "org.ekstep.questionset",
      "question_create_id": "org.ekstep.question",
      "concepts_id": "org.ekstep.conceptselector"
    }
    $scope.filterData = {
      request: {
        "metadata": {
          "filters": [
            { "property": "version", "operator": "=", "value": 2 }
          ]
        },
        "sortOrder": [
          { "sortField": "code", "sortOrder": "ASC" }
        ]
      }
    };
    $scope.csspath = ecEditor.resolvePluginResource(pluginInstance.manifest.id, pluginInstance.manifest.ver, 'editor/style.css');

    $scope.questionSetConfigObj = {
      "title": "",
      "max_score": 1,
      "allow_skip": true,
      "show_feedback": true,
      "shuffle_questions": false,
      "shuffle_options": false,
      "total_items": 1
    };

    $scope.searchQuestions = function() {
      for (var key in $scope.filterObj) {
        if ($scope.filterObj.hasOwnProperty(key)) {
          $scope.filterData.request.metadata = {};
          $scope.filterData.request.metadata.filters = [{ "property": "version", "operator": "=", "value": 2 }];
        } else {
          s
          delete $scope.filterData.request.metadata;
          delete $scope.filterData.request.metadata.filters;
        }
      }

      // For my Questions option
      if ($scope.isMyQuestions) {

        var userId = ecEditor._.isUndefined(ctrl.context) ? '' : (ctrl.context.uid || ctrl.context.user.id);
        $scope.filterData.request.metadata.filters.push({ "property": "createdBy", "operator": "=", "value": userId });
      }

      // setting filters values and title to request data
      ecEditor._.forEach($scope.filterObj, function(value, key) {
        if (value) {
          switch (key) {
            case "question_title":
              $scope.filterData.request.metadata.filters.push({ "property": "title", "operator": "contains", "value": value });
              break;
            case "gradeLevel":
              if (value.length) {
                $scope.filterData.request.metadata.filters.push({ "property": "gradeLevel", "operator": "=", "value": value });
              }
              break;
            case "language":
              var lan = [];
              lan.push(value);
              $scope.filterData.request.metadata.filters.push({ "property": "language", "operator": "=", "value": lan });
              break;
            case "qlevel":
              $scope.filterData.request.metadata.filters.push({ "property": "qlevel", "operator": "=", "value": value });
              break;
            case "type":
              if (value.length) {
                $scope.filterData.request.metadata.filters.push({ "property": "type", "operator": "=", "value": value });
              }
              break;
            case "concepts":
              if (value.length > 0) {
                $scope.filterData.request.metadata.filters.push({ "property": "concepts", "operator": "=", "value": value });
              }
              break;
          }
        }
      });
      ecEditor.getService('assessment').getQuestionItems($scope.filterData, function(err, resp) {
        if (!err) {
          $scope.questions = resp.data.result.assessment_items;
          $scope.getUnselectedQuestionList();
          $scope.$safeApply();
        } else {
          $scope.itemsLoading = false;
          $scope.errorMessage = true;
          $scope.$safeApply();
          return;
        }
      });
    };

    $scope.getUnselectedQuestionList = function() {
      $scope.unselectedQuestions = _.difference($scope.questions, $scope.selectedQuestions);
    }


    /**
     *  init funtion is called when html is loaded
     *  @memberof QuestionFormController
     */
    $scope.init = function() {
      $scope.searchQuestions();
      $scope.selectedIndex = undefined;
      if (pluginInstance.editData) {
        $scope.selectedQuestions = pluginInstance.editData.data;
        $scope.questionSetConfigObj = pluginInstance.editData.config;
        $scope.isQuestionTab = false;
        $scope.isQuestionSetConfig = true;
        $scope.createTotalItemRange();
        $scope.questions = $scope.selectedQuestions.concat($scope.questions);
        for (var i = 0; i < $scope.selectedQuestions.length; i++) {
          for (var j = 0; j < $scope.questions.length; j++) {
            if ($scope.selectedQuestions[i].identifier == $scope.questions[j].identifier) {
              $scope.questions[j].isSelected = true;
            }
          }
        }
        for (var i = 0; i < $scope.selectedQuestions.length; i++) {
          for (var j = 0; j < $scope.questions.length; j++) {
            if ($scope.selectedQuestions[i].identifier == $scope.questions[j].identifier) {
              $scope.questions[j].isSelected = true;
            }
          }
        }
      }

      ecEditor.dispatchEvent($scope.pluginIdObj.concepts_id + ':init', {
        element: 'queSetConceptsTextBox',
        selectedConcepts: [], // All composite keys except mediaType
        callback: function(data) {
          $scope.Totalconcepts = data.length;
          $scope.conceptsText = '(' + data.length + ') concepts selected';
          $scope.filterObj.concepts = _.map(data, function(concept) {
            return concept.id;
          });
          $scope.selectedConceptsData = data;
          $scope.searchQuestions();
          $scope.$safeApply();
        }
      });

      ecEditor.getService('meta').getConfigOrdinals(function(err, res) {
        if (!err) {
          $scope.grades = res.data.result.ordinals.gradeLevel;
          $scope.languages = res.data.result.ordinals.language;
          ecEditor.jQuery('.ui.dropdown.lableCls').dropdown({ useLabels: false, forceSelection: false });
          $scope.$safeApply();

        }

      });

      ecEditor.addEventListener(pluginInstance.manifest.id + ":saveQuestion", function(event, data) {
        if (!data.isSelected) {
          data.isSelected = true;
        }

        /* var selQueIndex = _.findLastIndex($scope.questions, {
           identifier: data.identifier
         });
         if (selQueIndex < 0) {
           $scope.questions.unshift(data);
         } else {
           $scope.questions[selQueIndex] = data;
         }*/
        var selQueIndex = _.findLastIndex($scope.selectedQuestions, {
          identifier: data.identifier
        });
        if (selQueIndex < 0) {
          $scope.selectedQuestions.unshift(data);
        } else {
          $scope.selectedQuestions[selQueIndex] = data;
        }
        $scope.searchQuestions();
        //$scope.getUnselectedQuestionList();

        // $scope.selectQuestion(data);


      }, false);

    }

    /**
     *  creating range of number of items to display as per number of question selected
     *  @memberof QuestionFormController
     */
    $scope.createTotalItemRange = function() {
      $scope.itemRange = [];
      for (var i = 1; i <= $scope.selectedQuestions.length; i++) {
        $scope.itemRange.push(i);
      }
    }

    /**
     *  Creating list of selected questions for creating question set
     *  @memberof QuestionFormController
     */
    $scope.selectQuestion = function(selQuestion) {
      var selObjindex = $scope.selectedQuestions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.selectedQuestions.splice(selObjindex, 1);
      } else {
        $scope.selectedQuestions.unshift(selQuestion);
      }
      $scope.getUnselectedQuestionList();

    }

    /**
     *  Funtion to edit the config data of question
     *  @memberof QuestionFormController
     */
    $scope.editConfig = function(quesObj, index) {
      $scope.selectedIndex = index;
      $scope.selQuestionObj = {};
      $scope.selQuestionObj = quesObj;
      $scope.showConfigForm = true;
    }


    /**
     *  Funtion to remove question from selected question list
     *  @memberof QuestionFormController
     */
    $scope.removeQuestion = function(selQuestion) {
      var selObjindex = $scope.selectedQuestions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.selectedQuestions.splice(selObjindex, 1);
      }
      selObjindex = $scope.questions.indexOf(selQuestion);
      if (selObjindex > -1) {
        $scope.questions[selObjindex].isSelected = false;
      }
      $scope.getUnselectedQuestionList();
    }


    /**
     *  Funtion to remove question from selected question list
     *  @memberof QuestionFormController
     */
    $scope.saveConfig = function() {
      /* var selectedObjIndex = _.findLastIndex($scope.selectedQuestions, {
         questionId: $scope.selQuestionObj.questionId
       });
       if (selectedObjIndex > -1) {
         $scope.selectedQuestions[selectedObjIndex] = $scope.selQuestionObj;
         $scope.showConfigForm = false;
       }*/
      selectedObjIndex = _.findLastIndex($scope.questions, {
        identifier: $scope.selQuestionObj.identifier
      });
      if (selectedObjIndex > -1) {
        $scope.questions[selectedObjIndex] = $scope.selQuestionObj;
      }

      delete $scope.questionObj;
    }

    $scope.closeConfigForm = function() {
      $scope.selQuestionObj = {};
      $scope.showConfigForm = false;
    }



    /**
     *  Funtion to save question set
     *  @memberof QuestionFormController
     */
    $scope.createQuestionSet = function() {
      $scope.questionSetConfigObj.total_items = $scope.selectedQuestions.length;
      $scope.questionSetConfigObj.max_score = $scope.selectedQuestions.length;
      $scope.isQuestionSetConfig = true;
      $scope.isQuestionTab = false;
      $scope.createTotalItemRange();
    }


    /**
     *  Funtion to add question set to editor. It dispatch an event to question set plugin for adding question set
     *  @memberof QuestionFormController
     */
    $scope.addQuestionSet = function() {
      var questionSet = {};
      var callback = pluginInstance.callback;
      questionSet.data = [];
      questionSet.config = $scope.questionSetConfigObj;
      questionSet.data = $scope.selectedQuestions;
      ecEditor.dispatchEvent($scope.pluginIdObj.question_set_id + ":addQS", { callback: callback, data: questionSet });
      $scope.closeThisDialog();
    }



    /**  Funtion to dispatch event to question creation plugin for creating new questions
     *  @memberof QuestionFormController
     */
    $scope.createQuestion = function() {
      ecEditor.dispatchEvent($scope.pluginIdObj.question_create_id + ":showpopup", {});
    }

    $scope.editQuestion = function(questionObj) {
      ecEditor.dispatchEvent($scope.pluginIdObj.question_create_id + ":showpopup", questionObj);
    }

    $scope.previewItem = function(question, bool) {
      var questionBody;
      if (_.isString(question.body))
        questionBody = JSON.parse(question.body);
      else
        questionBody = question.body;
      var qObj = {
        "config": JSON.stringify(questionBody.data.config),
        "data": JSON.stringify(questionBody.data.data),
        "id": "c943d0a907274471a0572e593eab49c2",
        "pluginId": questionBody.data.plugin.id,
        "pluginVer": questionBody.data.plugin.version,
        "templateId": questionBody.data.plugin.templateId,
        "type": "unit"
      }
      var questions = [];
      var data = {
        "org.ekstep.questionset": {}
      }
      questions.push(qObj);
      data["org.ekstep.questionset"]['org.ekstep.question'] = questions;
      var confData = { "contentBody": {}, "parentElement": true, "element": "#itemIframe" };
      document.getElementById("itemIframe").contentDocument.location.reload(true);
      var questionSetInstance = ecEditor.instantiatePlugin('org.ekstep.questionset.preview');
      confData.contentBody = questionSetInstance.getQuestionPreviwContent(data['org.ekstep.questionset']);
      ecEditor.dispatchEvent("atpreview:show", confData);
    }

    $scope.cancel = function() {
      $scope.closeThisDialog();
    }

    $scope.generateTelemetry = function(data, event) {
      var eventId;
      if (event.target) eventId = event.target.id;
      else eventId = event;
      if (data) ecEditor.getService('telemetry').interact({
        "type": data.type,
        "subtype": data.subtype,
        "id": data.id,
        "pageId": ecEditor.getCurrentStage().id,
        "target": {
          "id": eventId,
          "ver": "1.0",
          "type": data.type
        },
        "plugin": {
          "id": pluginInstance.manifest.id,
          "ver": pluginInstance.manifest.ver
        }
      })
    }


  }])


//# sourceURL=questionbankctrl.js