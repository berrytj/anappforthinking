// Waypoint View
// -------------

var app = app || {};

(function() {
    
    'use strict';
    	
	app.WaypointView = window.ObjectView.extend({
	    
	    className: "waypoint",
        
		// Cache the template function for a single waypoint.
		template: _.template( $('#waypoint-template').html() ),
		
		zoomSize: function() {
		    
		    this.$('.labelBlock').css('width', this.factor * ORIG_MAX_WIDTH);
		    
		    var labelCSS = { };
		    
		    // Below 0.7 or 0.6 add serifs?
		    if(this.factor < 1) labelCSS['font-family'] = 'HelveticaNeue';
		    else                labelCSS['font-family'] = 'HelveticaNeue-Light';
		    
		    labelCSS['font-size'] = this.factor * PRIMARY_FONT_SIZE + 'px';
            
		    this.$('label').css(labelCSS);
		    this.$('.destroy').css(labelCSS);  // Assumes destroy font is same size as label font.
		    
		},
		
	});

}());