// Toolbar View
// ------------

var app = app || {};

(function() {
    
    'use strict';

	app.ToolbarView = Backbone.View.extend({
	    
	    el: "#toolbar",
	    
		// The DOM events specific to an item.
		events: {
		    'click':            'doNothing',
		    'click #zoom-in':   'zoomIn',
		    'click #zoom-out':  'zoomOut',
		    'click #undo-btn':  'undo',
		    'click #redo-btn':  'redo',
		    'click #list-btn':  'list',
		    'click #paste-btn': 'paste',
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
		        this.$('#undo-btn').addClass('btn-disabled');
		    } else if (name === 'redo') {
		        this.$('#redo-btn').addClass('btn-disabled')
		    }
		    
		},
		
		fadeRedo: function() {
		    this.$('#redo-btn').addClass('btn-disabled');
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
		    this.$('#undo-btn').addClass('btn-disabled');
		    this.$('#redo-btn').addClass('btn-disabled');
		},
		
		saved: function() {
		    
		    this.undoEnabled = true;
		    this.$('#saving').text('saved');
		    if (app.Undos.length) this.$('#undo-btn').removeClass('btn-disabled');
		    if (app.Redos.length) this.$('#redo-btn').removeClass('btn-disabled');
		},
		
		disableList: function() {
		    this.enableList(false);
		},
		
		enableList: function(enabled) {
		    
		    this.listEnabled = enabled;
		    
		    if (enabled) {
		        this.$('#list-btn').removeClass('btn-disabled');
		    } else {
		        this.$('#list-btn').addClass('btn-disabled');
		    }
		    
		},
		
		enablePaste: function() {
		    this.$('#paste-btn').removeClass('btn-disabled');
		},
        	
		doNothing: function(e) { e.stopPropagation(); },
		
	});
	
}());