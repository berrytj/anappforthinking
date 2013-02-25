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
		    
		    var d = app.dispatcher;
		    
		    d.on('saved:undo',    this.doneSavingUndo,   this);
		    d.on('saving',        this.saving,           this);
		    d.on('saved',         this.doneSaving,       this);
		    d.on('enable:list',    this.enableList,       this);
		    d.on('clear:selected', this.disableList,      this);
		    d.on('clear:redos',    this.fadeRedoButton,   this);
		    d.on('redos:empty',    this.fadeRedoButton,   this);
		    d.on('redos:exist',    this.unfadeRedoButton, this);
		},
		
		unfadeRedoButton: function() {
		    this.$('#redo-button').removeClass('button-disabled');
		},
		
		fadeRedoButton: function() {
		    this.$('#redo-button').addClass('button-disabled');
		},
		
		zoomIn:      function() { app.dispatcher.trigger('zoom', ZOOM_IN_FACTOR);  },
		zoomOut:     function() { app.dispatcher.trigger('zoom', ZOOM_OUT_FACTOR); },
		
		list: function() {
		    if (this.listEnabled) app.dispatcher.trigger('list');
		},
		
		// Boolean refers to whether the action 'isRedo' or not:
		undo: function() {
		    
		    if(this.undoEnabled) {
		        this.savingUndo();
		        app.dispatcher.trigger('undo', false);
		    }
		},
		
		redo: function() {
		    
		    if(this.undoEnabled) {
		        this.savingUndo();
		        app.dispatcher.trigger('undo', true);
		    }
		},
		
		saving: function() {
		    this.$('#saving').text('saving...');
		},
		
		doneSaving: function() {
		    this.$('#saving').text('saved');
		},
		
		savingUndo: function() {
		    
		    this.undoEnabled = false;
		    this.saving();
		    this.$('#undo-button').addClass('button-disabled');
		    this.$('#redo-button').addClass('button-disabled');
		},
		
		doneSavingUndo: function() {
		    
		    this.undoEnabled = true;
		    this.doneSaving();
		    if (app.Undos.length) this.$('#undo-button').removeClass('button-disabled');
		    if (app.Redos.length) this.$('#redo-button').removeClass('button-disabled');
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