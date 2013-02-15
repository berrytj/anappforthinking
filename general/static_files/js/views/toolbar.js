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
		    'click #list-button': 'list',
		},
		
		initialize: function() {
		    this.undoEnabled = true;
		    this.listEnabled = false;
		    app.dispatcher.on('undoComplete', this.enableUndoButtons, this);
		    app.dispatcher.on('enableList', this.enableList, this);
		    app.dispatcher.on('clearSelected', this.disableList, this);
		    app.dispatcher.on('clearRedos', this.fadeRedoButton, this);
		},
		
		fadeRedoButton: function() {
		    
		    this.$('#redo-button').addClass('button-disabled');
		    
		},
		
		// Put these functions into app.js instead of separating into toolbar view?
		zoomIn:      function() { app.dispatcher.trigger('zoom', ZOOM_IN_FACTOR);  },
		zoomOut:     function() { app.dispatcher.trigger('zoom', ZOOM_OUT_FACTOR); },
		
		list: function() {
		    if(this.listEnabled) app.dispatcher.trigger('list');
		},
		
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
		
		disableList: function() {
		    this.enableList(false);
		},
		
		enableList: function(enabled) {
		    
		    this.listEnabled = enabled;  // 'enabled' is a boolean.
		    
		    if(enabled) this.$('#list-button').removeClass('button-disabled');
		    else        this.$('#list-button').addClass('button-disabled');
		},
        	
		doNothing: function(e) { e.stopPropagation(); },
		
	});
	
}());