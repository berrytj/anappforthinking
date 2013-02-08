// Mark Collection
// ---------------

var app = app || {};
var API_NAME = '/api/v1';

(function() {
    
    'use strict';
    
	var MarkSet = window.TastypieCollection.extend({

		// Reference to this collection's model.
		model: app.Mark,
		
		url: API_NAME + '/mark',
		
	});
	
	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
}());