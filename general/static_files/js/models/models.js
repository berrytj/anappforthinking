// Mark Model
// ----------

var app = app || {};
var API_NAME = '/api/v1';

(function() {
    
    'use strict';
    
	app.Mark = window.TastypieModel.extend({
		// Default attributes for the todo and ensure that each mark created
		// has 'text', 'x', and 'y' keys.
		defaults: {
			text: '',
			x: 0,
			y: 0
		},
		
		type: 'mark',
	});
	
	
	app.Waypoint = window.TastypieModel.extend({
	    
		defaults: {
			text: '',
			x: 0,
			y: 0
		},
		
		type: 'waypoint',
	});
	
	
	app.Undo = window.TastypieModel.extend({
	    
	    // Must specify in order to destroy undos after popping from collection:
	    urlRoot: API_NAME + '/undo',
	    
	    defaults: {
			obj_pk: 0,
			text: '',
			x: 0,
			y: 0
		},
	});
	
	
	app.Redo = window.TastypieModel.extend({
	    
	    // Must specify in order to destroy redos after popping from collection:
        urlRoot: API_NAME + '/redo',
        
        defaults: {
			obj_pk: 0,
			text: '',
			x: 0,
			y: 0
		},
	});
	
}());