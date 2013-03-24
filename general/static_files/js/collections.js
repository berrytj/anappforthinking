var app = app || {};

(function() {
	
	'use strict';
	
	// TastypieCollection translates the response
	// into a format that Backbone can work with.
	window.TastypieCollection = Backbone.Collection.extend({
		
		parse: function(response) {
			this.recent_meta = response.meta || {};
			return response.objects || response;
		}
		
	});
	

	
	var MarkSet = window.TastypieCollection.extend({
		
		model: app.Mark,
		url: API_NAME + "/mark",
		
	});
	
	app.Marks = new MarkSet(); // Create our global collection of Marks.
	

	
	var WaypointSet = window.TastypieCollection.extend({
		
		model: app.Waypoint,
		url: API_NAME + "/waypoint",
		
	});
	
	app.Waypoints = new WaypointSet(); // Create our global collection of Waypoints.
	
	

	var UndoSet = window.TastypieCollection.extend({
		
		model: app.Undo,
		url: API_NAME + "/undo",
		name: "undo",
		
	});
	
	app.Undos = new UndoSet(); // Create our global collection of Undos.

	// Undos need to be retrieved in order (LIFO).
	app.Undos.comparator = function(model) {
		return parseInt(model.get('id')); // In case `id` is saved as a string.
	};
	
	

	var RedoSet = window.TastypieCollection.extend({
		
		model: app.Redo,
		url: API_NAME + "/redo",
		name: "redo",
		
	});
	
	app.Redos = new RedoSet(); // Create our global collection of Redos.

	// Undos need to be retrieved in order (LIFO).
	app.Redos.comparator = function(model) {
		return parseInt(model.get('id')); // In case `id` is saved as a string.
	};
	

	
	var Clipboard = window.TastypieCollection.extend({});
	
	// Create our global Clipboard.
	app.Clipboard = new Clipboard();
	
	
}());