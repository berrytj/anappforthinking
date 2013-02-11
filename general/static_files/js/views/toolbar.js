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
		    'click #undo-button': 'undo',
		    'click #redo-button': 'redo',
		},
		
		initialize: function(options) {
		    this.dispatcher = options.dispatcher;
		    this.undoEnabled = true;
		    this.dispatcher.on('undoComplete', this.enableUndoButtons, this);
		},
		
		// Boolean refers to whether the action 'isRedo' or not:
		undo: function() {
		    if(this.undoEnabled) {
		        this.undoEnabled = false;
		        this.dispatcher.trigger('undo', false);
		    }
		},
		
		redo: function() {
		    if(this.undoEnabled) {
		        this.undoEnabled = false;
		        this.dispatcher.trigger('undo', true);
		    }
		},
		
		enableUndoButtons: function() {
		    this.undoEnabled = true;
		},
        	
		doNothing: function(e) { e.stopPropagation(); },
		
	});
	
}());