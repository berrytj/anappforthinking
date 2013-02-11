var app = app || {};
var API_NAME = '/api/v1';

(function() {
    
    'use strict';
    
    // Mark Collection
    // ---------------
    
	var MarkSet = window.TastypieCollection.extend({
	    
		model: app.Mark,
		url: API_NAME + '/mark',
	});
	
	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
	
	// Waypoint Collection
    // -------------------
    
	var WaypointSet = window.TastypieCollection.extend({
	    
		model: app.Waypoint,
		url: API_NAME + '/waypoint',
	});
	
	// Create our global collection of **Marks**.
	app.Waypoints = new WaypointSet();
	
	
	
	// Undo Collection
    // ---------------
	
	var UndoSet = window.TastypieCollection.extend({
	    
		model: app.Undo,
		url: API_NAME + '/undo',
	});
	
	// Create our global collection of **Undos**.
	app.Undos = new UndoSet();
	app.Undos.comparator = 'id';
	
	
	
	// Redo Collection
    // ---------------
    
	var RedoSet = window.TastypieCollection.extend({
		
		model: app.Redo,
		url: API_NAME + '/redo',
	});
	
	// Create our global collection of **Redos**.
	app.Redos = new RedoSet();
	app.Redos.comparator = 'id';
	
}());