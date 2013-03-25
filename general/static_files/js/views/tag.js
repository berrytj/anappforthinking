// Waypoint Tag View (single)
// --------------------------
// Each waypoint has a corresponding waypoint tag that,
// when clicked, initiates a scroll to the waypoint.

var app = app || {};
var WP_SCROLL_TIME = 1000;

(function() {
	
	'use strict';
	
	app.TagView = Backbone.View.extend({
		
		tagName: 'span',
		className: 'waypoint-tag',
		
		events: {
			'click': 'moveToWaypoint',
		},
		
		initialize: function(options) {
			
			this.waypoint = options.waypoint;
			this.text = options.text;
			this.el.id = 'tag_' + this.waypoint.model.get('id');
			
		},
		
		render: function() {
			this.$el.html(this.text);
			return this;
		},
		
		moveToWaypoint: function(e) {

			var model = this.waypoint.model;
			var left = model.get('x') * app.factor - $(window).width() / 2 + WP_WIDTH / 2;
			var top  = model.get('y') * app.factor - $(window).height() * WP_Y_FACTOR;
			
			$('html, body').animate({ scrollLeft: left, scrollTop:  top }, WP_SCROLL_TIME);
		},
				
	});

}());