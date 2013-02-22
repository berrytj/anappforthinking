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
		    app.dispatcher.on('undoComplete',  this.doneSaving,       this);
		    app.dispatcher.on('saving',        this.saving,           this);
		    app.dispatcher.on('doneSaving',    this.doneSaving,       this);
		    app.dispatcher.on('enableList',    this.enableList,       this);
		    app.dispatcher.on('clearSelected', this.disableList,      this);
		    app.dispatcher.on('clearRedos',    this.fadeRedoButton,   this);
		    app.dispatcher.on('redosEmpty',    this.fadeRedoButton,   this);
		    app.dispatcher.on('redosExist',    this.unfadeRedoButton, this);
		},
		
		unfadeRedoButton: function() {
		    
		    this.$('#redo-button').removeClass('button-disabled');
		    
		},
		
		fadeRedoButton: function() {
		    
		    this.$('#redo-button').addClass('button-disabled');
		    
		},
		
		// Put these functions into app.js instead of separating into toolbar view?
		zoomIn:      function() { app.dispatcher.trigger('zoom', ZOOM_IN_FACTOR);  },
		zoomOut:     function() { app.dispatcher.trigger('zoom', ZOOM_OUT_FACTOR); },
		
		list: function() {
		    if (this.listEnabled) app.dispatcher.trigger('list');
		},
		
		// Boolean refers to whether the action 'isRedo' or not:
		undo: function() {
		    if(this.undoEnabled) {
		        this.saving();
		        app.dispatcher.trigger('undo', false);
		    }
		},
		
		redo: function() {
		    if(this.undoEnabled) {
		        this.saving();
		        app.dispatcher.trigger('undo', true);
		    }
		},
		
		saving: function() {
		    
//		    this.undoEnabled = false;
		    this.$('#saving').text('saving...');
//		    this.$('#undo-button').addClass('button-disabled');
//		    this.$('#redo-button').addClass('button-disabled');
		},
		
		doneSaving: function() {
		    
//		    this.undoEnabled = true;
		    this.$('#saving').text('saved');
//		    if (app.Undos.length) this.$('#undo-button').removeClass('button-disabled');
//		    if (app.Redos.length) this.$('#redo-button').removeClass('button-disabled');
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