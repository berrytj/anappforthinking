// Waypoint View
// -------------

var app = app || {};
var WP_WIDTH = 140;
var WP_FONT_SIZE = 16;

(function() {
    
    'use strict';
    
	app.WaypointView = app.ObjectView.extend({
	    
	    className: "waypoint",
        
		// Cache the template function for a single waypoint.
		template: _.template( $('#waypoint-template').html() ),
		
		initialize: function() {
		    // Call super:
		    app.ObjectView.prototype.initialize.call(this);
		    this.tag = this.createTag(this.model.get('id'), this.model.get('text'));
		},
		
		render: function() {
		    // Call super:
		    app.ObjectView.prototype.render.call(this);
		    
		    if(this.model.get('text') === '') {
		        this.$el.removeClass('waypoint');
		        this.tag.$el.hide();
		    } else {
		        this.$el.addClass('waypoint');
		        if(this.tag.$el.is(':hidden')) this.tag.$el.show();
		    }
		},
		
		createTag: function(id, text) {
		        var view = new app.TagView({ waypoint_id: id, text: text });
		        // Too coupled to WaypointTagsView? But waypoint + tag need
		        // to know about each other.  Maybe WaypointTagsView is unnecessary.
			    $('#waypoint-tags').prepend(view.el);
			    view.render();
			    if(!text) view.hide();
			    return view;
		},
		
		zoomSize: function() {},
		
	});

}());