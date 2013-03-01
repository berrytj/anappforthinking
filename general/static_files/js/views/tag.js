// (Single) Waypoint Tag View
// --------------------------

var app = app || {};
var WP_SCROLL_TIME = 1000;

(function() {
    
    'use strict';
    
	app.TagView = Backbone.View.extend({
	    
	    tagName: 'span',
	    className: 'waypoint-tag',
        
		// The DOM events specific to an item.
		events: {
		    'click': 'moveToWaypoint',
		},
		
		initialize: function(options) {
		    
            this.waypoint = options.waypoint;
		    this.text = options.text;
		    
		},
		
		render: function() {
			this.$el.html(this.text);
			return this;
		},
		
		moveToWaypoint: function() {
            
            var wp = this.waypoint;
	        
	        var left = wp.model.get('x') * app.factor - $(window).width() / 2 + WP_WIDTH / 2;
	        var top  = wp.model.get('y') * app.factor - $(window).height() * WP_Y_FACTOR;
	        
	        $('html, body').animate({
	            
	            scrollLeft: left,
	            scrollTop:  top
	            
	        }, WP_SCROLL_TIME);
	        
		},
				
	});

}());