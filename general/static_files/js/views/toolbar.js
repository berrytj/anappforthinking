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
		    var d = this.dispatcher;
		    
		},
		
		undo: function() { this.dispatcher.trigger('undo');  },
		redo: function() { this.dispatcher.trigger('redo');  },
        	
		doNothing: function(e) { e.stopPropagation(); }
		
	});
	
}());