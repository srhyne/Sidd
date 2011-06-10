/*
 Sidd (short for Siddhārtha Gautama ;) plug-in for jQuery, allows you to integrate your Zendesk
 forum posts into your web site/application
 No License, use however you want!
 
 Configuration Options:
 
 state
  	Set the current state to either 0 or 1. This is used for the showMenus method. I suggest leaving it to 0
 
 url
 	The URL of your Zendesk. This could be your custom domain, e.g., http://support.mydomain.com or
  	just http://name.zendesk.com. This is a required parameter and no default is set
 
 data
 	To save on http requests & increase performance, you can use json method to copy your entire
 	Zendesk forum posts model to a json string to be saved in a local server file. Must have window.JSON support
      

 Methods : 
 
 Init
 	Use the init method first! This will bind all the sidd plugin methods and data to a desired "scope" element
	In the below example we are using document as our scope, I recommend using a SINGLE element for the scope.

	
	Init Example : $(document).sidd("init",{
						url : "http://domain.zendesk.com" // or your mapped domain "http://support.mydomain.com"
					},function(){
						//do something
					});
	

 data 	
 	This is your model "getter" method. Use this to filter and return desired Zendesk forum entries saved in $.data(scope).sidd
	You can filter by any key in forum entry json object! As of 6/2011 that's [body,created_at,flag_type_id, forum_id, hits, id,
	is_highlighted, is_locked, is_pinned, is_public, organization_id, pinned_index, position, posts_count, submitter_id, title,
	updated_at, votes_count], AND!.. dom_tag (more about dom_tags later)

	Example : var data = $(document).sidd("data",{
								current_tags : ["login", "access"],
								forum_id : 23422
							});

	A Note about the dom_tag filter.. This is a wonderful feature! Here's how it works. You add tags to your Zendesk forum posts like
	_wrapper, _nav, _my_other_id and so on. The "_" prepended tags (optional) represent id's IN YOUR DOM. Now you have a way to attach zendesk
	forum data or tooltips to specific parts of your application.
	
 	Example : var data = $(document).sidd("data",{
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

 get
	This method builds on top of the data method and adds an easy way to perform an action after filtering your posts.
	
	Example : $(document)
					.sidd("get",{
							body : "password"
						},function(data){
							$.each(data.filtered,function(){});
					})
					.data("chainable",true); //you can still chain from sidd ;)
	
 	
 showMenus
	This method takes advantage of the "dom_tag" filter. (Read more above under the data method for an in depth explaination.)
	The showMenus method will create tooltips next to each element with an DOM id that MATCHES a zendesk tag! It's easiest
	to understand with a demo.
	
	Example : $(document).sidd("showMenus",{dom_id : "_wrapper"});
	
	The above example will...
	1. filter your zendesk entries that have a tag of "_wrapper"
	2. attempt to find $("#wrapper:visible")
	3. Create a tooltip containing a menu of forums/entry links with an page offset near the $("#wrapper:visible") element! 

	Note : each menu get's a class of 'sidd-menu'. (See the sidd-menu css file for some nice tooltip styling.) However,
		   You can pass your own $(menu) to the showMenus configuration object to be cloned for each tooltip! So you
			don't have to use the sidd-menu class. 
	
	Example: $(document).sidd("showMenus",{
								dom_id : "_wrapper", 
								menu : $("<div/>",{"class" : "myownClassName", title : "zendesk-help"})
							});
	
 removeMenus
	Removes all of the current menus on the page. 
	Currently there is now way to remove only certain items from the menu stack
		
	Example: $(document).sidd("removeMenus");

 toggleMenus 
	Toggles the menus in the given scope. 
	
	Example: $(document).sidd("toggleMenus");		
	
 methods
 	Returns an array of all of sidd's public methods for easy reference
	
 json
	returns a json string of your entire Zendesk forum model to teh console. The purpose of this is to reduce 
	the number of http requests you make to zendesk upon invoking the init function. The number of requests 
	is based on the number of forums you have. 
	
	Example: $(document).sidd('json'); 
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
 */
(function($){
	
	//closure variables..
	var url = {
			search : "/search.json?query=",
			forums : "/forums",
			entries : "/entries"
		},
		
		//list of keys for zendesk entries json. Used to iterate and filter results without
		//knowing keys ahead of time. 
		entryKeys = [],
		
		//jsonp request to get all forum posts in Zendesk site. 
		getEntries = function(opts,callback){
			var _this = this,
				zendesk_data = {
					forums : {},
					entries : []
				},
			 	forumsUrl = opts.url+url.forums,
				forum_left = 0,
				json = ".json?callback=?",
				//return a deffered
				get = function(url){
						return $.getJSON(url);
				},
				processForumList = function(data){
					var l = data.reverse().length, f, _forums = zendesk_data.forums, forumEntries;
					forum_left = l;
					while(l--){
						f = data[l];
						_forums[f.id] = f.name;
						forumEntries = get(forumsUrl+"/" + f.id + url.entries + json);
						forumEntries.success(processForumEntries);
					}
					opts = $.extend(opts,{data : zendesk_data});
					$.data(_this[0],'sidd',opts);
				},
				processForumEntries = function(data){
					var l = data.reverse().length, e, _entries = zendesk_data.entries;
					forum_left -= 1;
					while(l--){
						e = data[l];
						e.current_tags = (e.current_tags || "").split(" ");
						_entries.push(e);
					}
					forum_left === 0 && typeof callback === "function" && callback.call(_this,zendesk_data);
				},
				forumList = get(forumsUrl+json);	
			forumList.success(processForumList); 	 
		},
		
		//filter methods passed 
		filter = {
			
			//@param data obj zendesk posts and forum titles
			//@param key 
			//@param id the dom id we are searching entry tags for!
			dom_tag : function(data, key, id){
				//fitler the current set of entries/posts
				//@param el obj the entry itself
				//@param i int index
				data.dom_tags = [];
				data.filtered = $.grep(data.filtered,function(el,i){
					//@param i index in current tags array
					//@param tag string tag in current_tags array
					$.each(el.current_tags,function(i,tag){
						if(tag.indexOf(id) === 0){
							tag = tag.replace("_","#");
							el.dom_tags = el.dom_tags || [];
							el.dom_tags.push(tag);
							data.dom_tags.indexOf(tag) === -1 && data.dom_tags.push(tag);
						}
					});
					return el.hasOwnProperty('dom_tags');
				});
				
			},
			
			//returns only entries with all tags passed
			current_tags : function(data, key, tags){
				
				data.filtered = $.grep(data.filtered, function(el, i){
					var l = tags.length;
					$.each(tags,function(i,v){
						el[key].indexOf(v) !== -1 && l--;
					});
					return l === 0;
				});
				
			},
			
			body : function(data, key, text){
				data.filtered = $.grep(data.filtered, function(el,i){
					return el[key].indexOf(text) !== - 1;
				});
			},	
			
			byKey : function(data, key, value){
				data.filtered = $.grep(data.filtered, function(el, i){
								return el[key] === value;
							});
				
			}
			
		},
		
		
		methods = {
			
			/**
			* init 
			* 
			* @param customOpts object pass in Configuration Options see Cofiguration Options above
			* @param callback function is passed the data object that either you passed into customOpts or is received from getEntries
			* @return $(x) when $(x).sidd('init',customOpts);
			*/
			init : function(customOpts,callback){
				var _this = this, 
					defaultOpts = {
						state : 0
					},
					opts = $.extend(defaultOpts,customOpts,true);	
				
				if(!opts.hasOwnProperty("url")){
					return $.error("No zendesk support url supplied");
				}
					
				$.data(this[0],"sidd",opts);
				
				if(opts.hasOwnProperty("data") && typeof callback === "function"){
					callback.call(this,opts.data);
				}
				else{
					getEntries.call(this,opts,callback);
				}
				return this;
			},
			
			/**
			* data 
			* 
			* @param customOpts object pass in filter object, can filter by any key in each entries object, as well as dom_tag
			* @param raw bool [optional] if true is passed then all data stored on scope object will be returned
			* @return $.data(x,"sidd").data when $(x).data({},true) else $.data(x,"sidd") when $(x).data({},[false] || [undefined])
			*/
			data : function(customOpts,raw){
				var opts = customOpts || {},
					sidd = $.data(this[0],"sidd"), 
					data = sidd.data;							
				if(!data.entries){
					$.error("Forum or entries data missing.");
					return this;
				}
				
				//perform once and stick in closure
				if(entryKeys.length === 0){
					$.each(data.entries[0],function(k,v){entryKeys.push(k);});
					entryKeys.push("dom_tag");
				}
				
				//reset filtered to the full entries
				data.filtered = data.entries.slice(0);
								
				$.each(entryKeys,function(filterIndex,filterKey){
					if(opts.hasOwnProperty(filterKey)){
						var method = filter.hasOwnProperty(filterKey) ? filterKey : "byKey";
						filter[method](data, filterKey, opts[filterKey]);
					}
				});
				
				return raw ? sidd : data;
			},
			
			/**
			* get
			* 
			* @param customOpts object pass in filter object, can filter by any key in each entries object, as well as dom_tag
			* @param callback function, invoke a function on the filtered posts
			* @return $(x) when $(x).sidd('get',customOpts,func);
			*/
			get : function(customOpts,callback){
				var opts = methods.data.call(this,customOpts,true),
					zendesk_data = opts.data;
				typeof callback === "function" && callback.call(this,zendesk_data);			
				return this; 					
			},
			
			/**
			* showMenus
			* 
			* @param customOpts object pass in filter object, can filter by any key in each entries object, as well as dom_tag prefix
			* @return $(x) when $(x).sidd('showMenus',customOpts);
			*/
			showMenus : function(customOpts){
				var opts = $.extend({
								//default search for dom tags is _ prepended forum tags
								//passing dom_tag will add filter.dom_tag to the list of executed filters.
								dom_tag : "_", 
								//default divClass is sidd-menu
								menu : $("<div/>",{"class" : "sidd-menu"}) 
								//change & extend these above options with when calling showMenus method
							}, customOpts, true),
					 data = $.data(this[0],"sidd"),
					_this = this,
					current_stack = $([]); 
					
				methods.get.call(this,opts,function(zendesk_data){
					var menu = opts.menu;			
					$.each(zendesk_data.dom_tags,function(index,selector){
						var anchor = _this.find("#"+selector+":visible").eq(0),
							offset, _tip,forumCheck = {}, _menu, entries;
						if(anchor[0]){
							offset = anchor.offset();
							_menu = menu
									.clone()
									.css({top : offset.top + 30, left : offset.left + 0});
									
							entries = $.grep(zendesk_data.filtered,function(obj){
											return obj.dom_tags.indexOf(selector) !== -1;
										});		
							
							entries.sort(function(a,b){a.forum_id - b.forum_id;});
							
							$.each(entries,function(key, entry){
								if(!forumCheck[entry.forum_id])
								$("<h1/>",{
											className : "sidd-forum-title", 
											text : zendesk_data.forums[entry.forum_id]
										}).appendTo(_menu);
										
								$("<p/>",{
									html : $("<a/>",{
											target : "_blank",
											href : data.url+url.entries+"/"+entry.id, 
											html : entry.title+" &raquo;"
									})
								}).appendTo(_menu);
							});	
							
							current_stack = current_stack.add(_menu);
							_menu
								.appendTo("body")
								.addClass("visible");
						}		
					});	
					
				});
				
				data.state = 1;
				data.current_stack = current_stack;
				return this;
			},
			
			/**
			* removeMenus
			* 
			* @param customOpts object currently doesn't have any effect on what elements are removed
			* @return $(x) when $(x).sidd('removeMenus',customOpts);
			*/
			removeMenus : function(customOpts){
				var data = $.data(this[0],"sidd");
				data.state = 0;
				//TODO do you need an $.each here? Can you just remove the stack in general? 
				data.current_stack && data.current_stack.remove();
				return this;
			},
			
			/**
			* toggleMenus
			* 
			* @param customOpts object pass in filter object, can filter by any key in each entries object, as well as dom_tag prefix
			* @return $(x) when $(x).sidd('toggleMenus',customOpts);
			*/
			toggleMenus : function(customOpts){
				var state = $.data(this[0],"sidd").state,
					_event = state === 0 ? "showMenus" : "removeMenus";	
				methods[_event].call(this,customOpts);
				return this;
			},
			
			/**
			* methods
			* @return array list of methods that can be called. Self documentation. 
			*/
			methods : function(){
				var _methods = [];
				$.each(methods,function(k){
					_methods.push(k);
				});
				return _methods;
			}, 
			
			/**
			* methods
			* @return string json formatted string of all Zendesk forum/entries. 
			* 	Copy, save to file, or localStorage. Don't modify structure.
			*/
			json : function(){
				var data = methods.data.call(this,{});
				delete data.filtered;
				return window.JSON 
							? JSON.stringify(data)
							: $.error("window.JSON not supported\nhttps://github.com/douglascrockford/JSON-js");
			}
		
		};
	
	 $.fn.sidd = function( method ) {

	    if(methods[method]){
	      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } 
		return $.error( 'Method ' +  method + ' does not exist on jQuery.sidd' );
	};
		
})(jQuery);



