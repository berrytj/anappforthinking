// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 500;
var INPUT_HEIGHT = 100;  // Can't use .height() because of padding -- try outerHeight()
var ARROW_PADDING = 8;

(function() {
    
    'use strict';
    
	app.WaypointTagsView = Backbone.View.extend({
	    
	    el: '#waypoint-tags',

		// The DOM events specific to an item.
		events: {
		    'mousedown #hide-tags'   : 'doNothing',
		    'mousedown .waypoint-tag': 'doNothing',
		    'click #hide-tags'       : 'hideTags',
		    'click #add-waypoint'    : 'showInput',
		},
		
		initialize: function() {
		    app.dispatcher.on('waypoint:created', this.createTag, this);
		},
		
		hideTags: function() {
		    var button = this.$('#hide-tags');
		    if(button.html() === '«') {
		        var offscreen = (button.offset().left - $(document).scrollLeft() - ARROW_PADDING) * -1;
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
		
		doNothing: function(e) { e.stopPropagation(); },
				
	});

}());