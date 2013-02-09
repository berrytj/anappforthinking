var app = app || {};
var API_NAME = '/api/v1';

(function() {
    
    'use strict';
    
    // Mark Collection
    // ---------------
    
	var MarkSet = window.TastypieCollection.extend({

		// Reference to this collection's model.
		model: app.Mark,
		
		url: API_NAME + '/mark',
		
	});
	
	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
	
	// Undo Collection
    // ---------------
	
	var UndoSet = window.TastypieCollection.extend({

		// Reference to this collection's model.
		model: app.Undo,
		
		url: API_NAME + '/undo',
		
	});
	
	// Create our global collection of **Undos**.
	app.Undos = new UndoSet();
	
	
	// Redo Collection
    // ---------------
    
	var RedoSet = window.TastypieCollection.extend({

		// Reference to this collection's model.
		model: app.Redo,
		
		url: API_NAME + '/redo',
		
	});
	
	// Create our global collection of **Redos**.
	app.Redos = new RedoSet();
	
}());