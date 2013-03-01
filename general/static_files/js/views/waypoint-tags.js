// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 250;
var ARROW_PADDING = 26;
var ORIG_WP_Y_FACTOR = 0.4;
var WP_Y_FACTOR = 0.35;
var TAGS_LEFT = $('#waypoint-tags').offset().left;

(function() {
    
    'use strict';
    
	app.WaypointTagsView = Backbone.View.extend({
	    
	    el: '#waypoint-tags',

		// The DOM events specific to an item.
		events: {
		    // switch donothing to cleanup
		    'mousedown #hide-tags'   : 'doNothing',
		    'mousedown .waypoint-tag': 'doNothing',
		    'click #hide-tags'       : 'hideTags',
		    'click #add-waypoint'    : 'showInput',
		},
		
		hideTags: function() {
		    
		    var button = this.$('#hide-tags');
		    
		    var x, arrow;
		    
		    if (button.html() === '«') {
		        x = -1 * ( button.offset().left - $(document).scrollLeft() - ARROW_PADDING );
		        arrow = '»';
		    } else {
		        x = TAGS_LEFT;
		        arrow = '«';
		    }
		    
		    this.$el.animate({
		        
		        left: x,
		        
		    }, HIDE_TIME, function() { button.html(arrow); });
		    
		},
		
		showInput: function() {
		    
		    var $input = $('#waypoint-input');
		    
		    var relative_x = ( $(window).width() - $input.width() ) / 2;
		    var relative_y = ( $(window).height() - $input.outerHeight() ) * ORIG_WP_Y_FACTOR;
		    
		    var left = relative_x + $(document).scrollLeft();
	        var top  = relative_y + $(document).scrollTop();
	        
	        $input.show().offset({ left: left, top: top }).focus();
	        
//	        $window.keyup... don't allow more than one shift+enter
            
		},
		
		doNothing: function(e) { e.stopPropagation(); },
				
	});

}());