// (Single) Waypoint Tag View
// --------------------------

var app = app || {};
var WAYPOINT_TIME = 1000;
var WP_FROM_TOP = 0.35;

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
		    this.waypoint_id = options.waypoint_id;
		    this.text = options.text;
		},
		
		render: function() {
			this.$el.html(this.text);
			return this;
		},
		
		moveToWaypoint: function() {
		    var wp = app.Waypoints.get(this.waypoint_id);
	        var left = wp.get('x')*app.factor - $(window).width()/2 + WP_WIDTH/2;
	        var top  = wp.get('y')*app.factor - $(window).height() * WP_FROM_TOP;
	        $("html, body").animate({ scrollLeft:left, scrollTop:top }, WAYPOINT_TIME);
		},
				
	});

}());