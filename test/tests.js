function tests(json){
	var $scope = $("#scope"),
		URL = "https://support.zendesk.com",
		initMethodAsyncTests = function(data){
			sidd = $.data($scope[0], "sidd");
			ok(typeof sidd === "object", "data saved on scope is under 'sidd' key and is an object");				
			ok(sidd["data"].hasOwnProperty("forums"), "sidd.data.forums exists");
			ok(sidd.data.hasOwnProperty("entries"), "sidd.data.entries exists"); 
			ok(sidd.data.entries.length !== 0, "sidd.data.entries not empty");	
			//for subsequent tests save the data to the window for use in other tests..
			start();
		};
	window.sidd_data = json;

	
	test("$.fn.sidd",function(){
		
		//undefined method handle
		raises(function(){
			$scope.sidd("testing");
		},"Must throw 'no method' error");
		
		//sidd is a function
		ok(typeof $.fn.sidd === "function","sidd should be a function");					
	});
	
	test("init method base",function(){					
		//undefined method handle
		raises(function(){
			$scope.sidd("init",{});
		},"Must throw no url supplied error");
	});
	
	test("init method with jsonp call to zendesk",function(){
		var config = {url : URL}, sidd;
		stop();	
		deepEqual($scope, $scope.sidd('init', config,initMethodAsyncTests),
				"init method returns jquery scope variable");
	});
	
	
	test("init method feeding in window.sidd_data",function(){
		var config = {url : URL, data : window.sidd_data};
		deepEqual($scope, $scope.sidd('init', config, initMethodAsyncTests),"init method returns jquery scope variable");
	});
	

	test("data method",function(){
		raises(function(){
			$scope.sidd("init",{url : URL,data :{}}).sidd("data",{});
		},"must throw no entries error");
		
		//init again
		$scope.sidd("init",{url : URL, data : window.sidd_data});
		data = $scope.sidd("data",{});
		ok($scope !== data,"data should not return $scope element, but rather a data object");
		ok(!data.hasOwnProperty("url"),"returned data should not have url member unless raw param is passed");
		ok(!$.isArray(data.forums && typeof data.forums === "object"), "forums is not an array, it's an object");
		ok($.isArray(data.entries), "entries is any array");
		ok(data.entries.length !== 0, "data.entries is not empty"); 
		ok($.isArray(data.filtered), "data.filtered is an array");
		ok(data.filtered.length === data.entries.length, "data.filtered is not filtered when no config filter is passed");
	});
	
	
	test("data method filters",function(){
		var data, filtered_length;
		$scope.sidd("init", {url : URL, data : window.sidd_data});
		//testing tags
		data = $scope.sidd("data",{ current_tags : ["agents","forum"]});
		filtered_length = data.filtered.length;
		filtered_length !== 0 && (function(){
			$.each(data.filtered,function(i,entry){
				filtered_length -= entry.current_tags.indexOf("agents") !== -1 
									&& entry.current_tags.indexOf("forum") !== -1 
									? 1 
									: 0;
			});
			ok(filtered_length === 0, "All entries with a current tags of 'agents' and 'forum' are in filtered array");
		})();
		
		//test body filtere 
		data = $scope.sidd("data",{ body : "times", forum_id : 1848});
		filtered_length = data.filtered.length;
		filtered_length !== 0 && (function(){
			$.each(data.filtered,function(i,entry){
				filtered_length -= entry.body.indexOf("times") !== -1 
									? 1 
									: 0;
			});
			ok(filtered_length === 0, "All entries with 'times' in their body and in forum_id 1848 are in the filtered array");
		})();
		
		
		//test body filtere 
		data = $scope.sidd("data",{ dom_tag : "forum"});
		ok($.isArray(data.dom_tags),"dom_tags is an array");
		if(data.dom_tags.length !==0){
			ok(data.dom_tags.indexOf("forum") !== -1, "dom_tags equal to #forum are present");
		}	
	});
	
	test("get method",function(){
		//init
		$scope.sidd("init", {url : URL, data : window.sidd_data});
		ok($scope === $scope.sidd('get',{}),"returns scope element");
		
		$scope.sidd("get",{forum_id : 1848},function(data){
			ok(data.hasOwnProperty("forums"),"callback data variable has forums");
			ok(data.hasOwnProperty("entries"), "callback data variable has entries");
			ok(data.hasOwnProperty("filtered"), "callback data variable has filtered");
		});
	});
	
	test("toggleMenus",function(){
		$scope.sidd("init", {url : URL, data : window.sidd_data});
		$scope.sidd("toggleMenus",{dom_tag : "forum"});
		ok($scope.data('sidd').state === 1, "state is 1 when toggleMenus is called for the first time");
		$scope.sidd("toggleMenus",{dom_tag : "forum"});
		ok($scope.data('sidd').state === 0, "state is 0 when toggleMenus is called again");
	});
}






