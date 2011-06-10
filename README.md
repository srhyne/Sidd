#Sidd 

Sidd, short for [Siddhārtha Gautama](http://en.wikipedia.org/wiki/Gautama_Buddha), is a plug-in for jQuery. It allows you to integrate Zendesk forum posts into your web site/application. No License, use however you want!

##Demo? 

I put most of my initial development into building an extensible & flexible plugin so the demos are a little paltry right now. 
[Here's a small demo](http://srhyne.github.com/Sidd/demos/)
 
##Configuration Options:
 
###state

Set the current state to either 0 or 1. This is used for the showMenus method. I suggest leaving it to 0
 
###url

The URL of your Zendesk. This could be your custom domain, e.g., http://support.mydomain.com or
just http://name.zendesk.com. This is a required parameter and no default is set
 
###data
To save on http requests & increase performance, you can use json method to copy your entire
Zendesk forum posts model to a json string to be saved in a local server file. Must have window.JSON support
      

##Methods : 
 
###Init
Use the init method first! This will bind all the sidd plugin methods and data to a desired "scope" element
In the below example we are using document as our scope, I recommend using a SINGLE element for the scope.

Init Example : 

	$(document).sidd("init",{
			url : "http://domain.zendesk.com" 
			// or your mapped domain "http://support.mydomain.com"
		},function(){
			//do something
		});
	

###data 	
 This is your model "getter" method. Use this to filter and return desired Zendesk forum entries saved in $.data(scope).sidd
You can filter by any key in forum entry json object! As of 6/2011 that's [body,created_at,flag_type_id, forum_id, hits, id,
is_highlighted, is_locked, is_pinned, is_public, organization_id, pinned_index, position, posts_count, submitter_id, title,
updated_at, votes_count], AND!.. dom_tag (more about dom_tags later)

Example : 

	var data = $(document).sidd("data",{
					current_tags : ["login", "access"],
					forum_id : 23422
				});

A Note about the dom_tag filter.. This is a wonderful feature! Here's how it works. You add tags to your Zendesk forum posts like
_wrapper, _nav, _my_other_id and so on. The "_" prepended tags (optional) represent id's IN YOUR DOM. Now you have a way to attach zendesk
forum data or tooltips to specific parts of your application.

Example :

	var data = $(document).sidd("data",{
   							 dom_tag : "_"  //or a full id like "_wrapper"
							},true);
							
			  $.each(data.dom_tags, function(index,selector){
			
					//get the element by dom_tag
				var el = _this.find(selector+":visible").eq(0),	
				
					//get the entries containing this dom id
					entries = $.grep(data.filtered,function(obj){
									return obj.dom_tags.indexOf(selector) !== -1;
								});
			});
	
Check out the showMenus code to see how the dom_tag filter is used. 

###get
This method builds on top of the data method and adds an easy way to perform an action after filtering your posts.
	
Example : 	

	$(document)
		.sidd("get",{
				body : "password"
			},function(data){
				$.each(data.filtered,function(){});
		})
		.data("chainable",true); //you can still chain from sidd ;)

 	
###showMenus
This method takes advantage of the "dom_tag" filter. (Read more above under the data method for an in depth explaination.)
The showMenus method will create tooltips next to each element with an DOM id that MATCHES a zendesk tag! It's easiest
to understand with a demo.

Example :
	$(document).sidd("showMenus",{dom_id : "_wrapper"});
	
The above example will...
* filter your zendesk entries that have a tag of "_wrapper"
* attempt to find $("#wrapper:visible")
* Create a tooltip containing a menu of forums/entry links with an page offset near the $("#wrapper:visible") element! 

Note : each menu get's a class of 'sidd-menu'. (See the sidd-menu css file for some nice tooltip styling.) However,
You can pass your own $(menu) to the showMenus configuration object to be cloned for each tooltip! So you
don't have to use the sidd-menu class. 
	
Example: 	

	$(document).sidd("showMenus",{
		dom_id : "_wrapper", 
		menu : $("<div/>",{"class" : "myownClassName", title : "zendesk-help"})
	});
	
###removeMenus
Removes all of the current menus on the page. 
Currently there is now way to remove only certain items from the menu stack
		
Example: 

	$(document).sidd("removeMenus");

###toggleMenus 
Toggles the menus in the given scope. 

Example: 

	$(document).sidd("toggleMenus");		

###methods
Returns an array of all of sidd's public methods for easy reference
	
###json
returns a json string of your entire Zendesk forum model to teh console. The purpose of this is to reduce 
the number of http requests you make to zendesk upon invoking the init function. The number of requests 
is based on the number of forums you have. 

Example: 

	$(document).sidd('json'); 
		//then c&p the output to say sidd.json
	
		//then init sidd using the local json model file..
		$.getJSON("../server/sidd.json",function(json){
			$(document).sidd("init",{
				url : "http://support.mymapped_domain.com", //you pass the url anyways for menu links
				data : json
			});
		});

		//or you could use localstorage, amplify.js, or lawnchair to save and recover later!
		
		localstorage["sidd"] = $(document).sidd('json');
	
		//later 
		var data = JSON.parse(localstorage["sidd"] || "[]"), 
			config = {url : "http://support.mymapped_domain.com"};
		if(data.length !== 0)
		{
			config[data] = data;
		}
		$(document).sidd("init",config);
	
	
			
			