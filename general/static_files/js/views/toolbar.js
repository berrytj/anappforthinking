// Toolbar View
// ------------

var app = app || {};

(function() {
    
    'use strict';

	app.ToolbarView = Backbone.View.extend({
	    
	    el: "#toolbar",
	    
		// The DOM events specific to an item.
		events: {
		    'click':           'doNothing',
		    'click #zoom-in':      'zoomIn',
		    'click #zoom-out':     'zoomOut',
		    'click #undo-button':  'undo',
		    'click #redo-button':  'redo',
		    'click #list-button':  'list',
		    'click #paste-button': 'paste',
		},
		
		initialize: function() {
		    
		    this.undoEnabled = true;
		    this.listEnabled = false;
		    
		    var d = app.dispatcher;
		    
		    d.on('try:undo',       this.undo,        this);
		    d.on('try:redo',       this.redo,        this);
		    d.on('saving',         this.saving,      this);
		    d.on('saved',          this.saved,       this);
		    d.on('enable:list',    this.enableList,  this);
		    d.on('enable:paste',   this.enablePaste, this);
		    d.on('clear:selected', this.disableList, this);
		    d.on('clear:redos',    this.fadeRedo,    this);
		    d.on('stack:empty',    this.fade,        this);
		},
		
		fade: function(name) {
		    
		    if (name === 'undo') {
		        this.$('#undo-button').addClass('button-disabled');
		    } else if (name === 'redo') {
		        this.$('#redo-button').addClass('button-disabled')
		    }
		    
		},
		
		fadeRedo: function() {
		    this.$('#redo-button').addClass('button-disabled');
		},
		
		zoomIn:      function() { app.dispatcher.trigger('zoom', ZOOM_IN_FACTOR);  },
		zoomOut:     function() { app.dispatcher.trigger('zoom', ZOOM_OUT_FACTOR); },
		
		list: function() {
		    if (this.listEnabled) app.dispatcher.trigger('list');
		},
		
		paste: function() {
		    app.dispatcher.trigger('paste');
		},
		
		// Boolean refers to whether the action 'isRedo' or not:
		undo: function() {
		    if (this.undoEnabled) app.dispatcher.trigger('undo', false);
		},
		
		redo: function() {
		    if (this.undoEnabled) app.dispatcher.trigger('undo', true);
		},
		
		saving: function() {
		    
		    this.undoEnabled = false;
		    this.$('#saving').text('saving...');
		    this.$('#undo-button').addClass('button-disabled');
		    this.$('#redo-button').addClass('button-disabled');
		},
		
		saved: function() {
		    
		    this.undoEnabled = true;
		    this.$('#saving').text('saved');
		    if (app.Undos.length) this.$('#undo-button').removeClass('button-disabled');
		    if (app.Redos.length) this.$('#redo-button').removeClass('button-disabled');
		},
		
		disableList: function() {
		    this.enableList(false);
		},
		
		enableList: function(enabled) {
		    
		    this.listEnabled = enabled;
		    
		    if (enabled) {
		        this.$('#list-button').removeClass('button-disabled');
		    } else {
		        this.$('#list-button').addClass('button-disabled');
		    }
		    
		},
		
		enablePaste: function() {
		    this.$('#paste-button').removeClass('button-disabled');
		},
        	
		doNothing: function(e) { e.stopPropagation(); },
		
	});
	
}());