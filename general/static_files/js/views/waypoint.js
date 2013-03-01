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
		
		events: _.extend({ 'click': 'toggleSelected' }, app.ObjectView.prototype.events),
		
		initialize: function() {
		    
		    app.ObjectView.prototype.initialize.call(this);  // Call super.
		    
		    this.tag = this.createTag(this.model.get('text'));
		    
		},
		
		render: function() {
		    
		    app.ObjectView.prototype.render.call(this);  // Call super.
		    
		    if (this.model.get('text') === '') {
		        
		        this.$el.removeClass('waypoint');
		        this.tag.$el.hide();
		        
		    } else {
		        
		        this.$el.addClass('waypoint');
		        this.tag.$el.show();
		        
		    }
		    
		},
		
		createTag: function(text) {
		        
		        var view = new app.TagView({
		            waypoint: this,
		            text: text
		        });
		        
			    $('#waypoint-tags').prepend(view.el);
			    view.render();
			    if (!text) view.$el.hide();
			    
			    return view;
			    
		},
		
		zoomSize: function() {},  // Don't change waypoint size when zooming. May change.
		
		toggleSelected: function(e) {
		    
		    if (e.shiftKey || e.metaKey || e.ctrlKey) {
		        this.$el.toggleClass('ui-selected');
		    }
		    
		},
		
	});

}());