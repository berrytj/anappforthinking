// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 500;
var INPUT_HEIGHT = 100;  // Can't use .height() because of padding.

(function() {
    
    'use strict';
    	
	app.WaypointTagsView = Backbone.View.extend({
	    
	    el: '#waypoint-tags',

		// The DOM events specific to an item.
		events: {
		    'mousedown'               : 'doNothing',
		    'click    #hide-tags'     : 'hideTags',
		    'click    #add-waypoint'  : 'showInput',
		    'click    .waypoint-tag'  : 'moveToWaypoint',
		},
		
		initialize: function(options) {
		    this.dispatcher = options.dispatcher;
		},
		
		hideTags: function() {
		    var button = this.$('#hide-tags');
		    if(button.html() === '«') {
		        var offscreen = (button.offset().left - $(document).scrollLeft()) * -1; //+15?
		        this.$el.animate({ left: offscreen }, HIDE_TIME, function() { button.html('»'); });
	        } else {
	            this.$el.animate({ left: 0 }, HIDE_TIME, function() { button.html('«'); });
	        }
		},
		
		showInput: function() {
		    // Move this to AppView?
		    var input = $('#waypoint-input');
		    var left = ($(window).width() - input.width()) * 0.5 + $(document).scrollLeft();
	        var top  = ($(window).height() - INPUT_HEIGHT) * 0.4 + $(document).scrollTop();
	        input.show().offset({ 'left': left, 'top': top }).focus();
//	        $window.keyup... don't allow more than one return/enter
		},
		
		moveToWaypoint: function() {
		    //
		},
		
		doNothing: function(e) { e.stopPropagation(); },
		

/*
function moveToWaypoint($obj) {
	var pos = $("#waypoint" + getPK($obj)).offset();
	var left = pos.left - 0.5*$(window).width() + 0.5*$wInput.width();
	var top = pos.top - 0.4*$(window).height() + 0.5*100;
	$("html, body").animate({ scrollLeft:left, scrollTop:top }, 1000);
}

function createWaypointTag($wp, pk) {
    var tagHtml = '<span id="waypoint'+ pk +'tag" class="wp-tag">'+ $wp.text() +'</span>';
	$("#waypoint-tags").prepend(tagHtml);
	var $tag = $("#waypoint"+pk+"tag");
	$tag.mousedown(function(e) { mousedownEvents(e, $tag); });
	$tag.mouseup(function(e) { mouseupEvents(e, $tag); });
}

function initWaypoint($wp) {
	if($wp.attr("id") !== "w-input") {
		makeDraggable($wp, "waypoint");
//		attachX($wp, "waypoint");
		$wp.mousedown(function(e) { mousedownEvents(e, $wp); });
		$wp.mouseup(function(e) { mouseupEvents(e, $wp); });
		var pk = getPK($wp);
		if(!$("#waypoint"+pk+"tag").length) createWaypointTag($wp, pk);
	}
}


function drawWaypoint(text, x, y, pk) {
	$("#wrapper").append( $("<div>").text(text).attr("id","waypoint"+pk) );
	$wp = $("#waypoint"+pk);
	$wp.offset({ "left":x, "top":y }).addClass("waypoint");
}
*/		
		
		
		
		
		
		
	});

}());