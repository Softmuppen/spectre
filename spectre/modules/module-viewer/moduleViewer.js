angular.module('spectreApp.moduleViewer',[]).controller('ModuleViewerController', ['$scope', function($scope){

	$scope.moduleViewerTemplate = "modules/module-viewer/moduleViewer.html";

	$scope.moduleList = [
		{description:"Trafic Information", template:"modules/nearby-stop/nearbyStop.html"},
		{description:"Settings", template:"modules/settings/settings.html"}
	];

	$scope.activeModule = $scope.moduleList[0];

	$scope.setActiveModule = function(module){
		$scope.activeModule = module;
	};

	$scope.getModuleStatus = function(module){
		return module == $scope.activeModule ? "active" : "" 
	};

}]);
