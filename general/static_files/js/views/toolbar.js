// Toolbar View
// ------------

var app = app || {};

(function() {
    
    'use strict';

	app.ToolbarView = Backbone.View.extend({
	    
	    el: "#toolbar",
	    
		// The DOM events specific to an item.
		events: {
		             'mousedown': 'doNothing',
		        'click #zoom-in': 'zoomIn',
		       'click #zoom-out': 'zoomOut',
		    'click #undo-button': 'undo',
		    'click #redo-button': 'redo',
		        'click #line-up': 'lineUp',
		   'click #evenly-space': 'evenlySpace',
		},
		
		initialize: function() {
		    this.undoEnabled = true;
		    app.dispatcher.on('undoComplete', this.enableUndoButtons, this);
		},
		
		// Put these functions into app.js instead of separating into toolbar view?
		lineUp:      function() { app.dispatcher.trigger('lineUp'); },
		evenlySpace: function() { app.dispatcher.trigger('evenlySpace'); },
		zoomIn:      function() { app.dispatcher.trigger('zoom', ZOOM_IN_FACTOR);  },
		zoomOut:     function() { app.dispatcher.trigger('zoom', ZOOM_OUT_FACTOR); },
		
		// Boolean refers to whether the action 'isRedo' or not:
		undo: function() {
		    if(this.undoEnabled) {
		        this.undoEnabled = false;
		        app.dispatcher.trigger('undo', false);
		    }
		},
		
		redo: function() {
		    if(this.undoEnabled) {
		        this.undoEnabled = false;
		        app.dispatcher.trigger('undo', true);
		    }
		},
		
		enableUndoButtons: function() {
		    this.undoEnabled = true;
		},
        	
		doNothing: function(e) { e.stopPropagation(); },
		
	});
	
}());