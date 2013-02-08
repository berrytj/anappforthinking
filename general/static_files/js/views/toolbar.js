// Toolbar View
// ------------

var app = app || {};
var ZOOM_OUT_FACTOR = 0.85;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;

(function() {
    
    'use strict';

	app.ToolbarView = Backbone.View.extend({
	    
	    el: "#toolbar",
	    
		// The DOM events specific to an item.
		events: {
		    'mousedown': 'doNothing',
		    'click #zoom-out':    'zoomOut',
		    'click #zoom-in':     'zoomIn',
//		    'click #undo-button': 'undo',
//		    'click #redo-button': 'redo',
		},
		
		initialize: function(options) { this.dispatcher = options.dispatcher; },
		
		zoomOut: function() { this.zoom(ZOOM_OUT_FACTOR); },
		zoomIn:  function() { this.zoom(ZOOM_IN_FACTOR);  },
		
		zoom: function(factor) { this.dispatcher.trigger('zoom', factor); },
		
//		undo:    function() { this.dispatcher.trigger('zoomIn');  },
//		redo:    function() { this.dispatcher.trigger('zoomIn');  },
        		
		doNothing: function(e) { e.stopPropagation(); }
		
	});
	
}());