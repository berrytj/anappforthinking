// Mark Model
// ----------

var app = app || {};
var API_NAME = "/api/v1";

(function() {
	
	'use strict';
	
	// TastypieModel cleans the data from Tastypie to work
	// properly with Backbone.
	window.TastypieModel = Backbone.Model.extend({
		
		// Override Backbone sync by adding AJAX call to queue with
		// Backbone sync as a callback, so that we don't make calls
		// in the wrong order.
		sync: function(method, model, options) {
			addToQueue(method, model, options, this, Backbone.sync);	
		},
		
		// Give Backbone the API url in the proper format.
		base_url: function() {
			var temp_url = Backbone.Model.prototype.url.call(this);
			return (temp_url.charAt(temp_url.length - 1) == '/' ? temp_url : temp_url + '/');
		},
		
		url: function() {
			return this.base_url();
		}
		
	});
	
	
	app.Obj = window.TastypieModel.extend({
		
		defaults: {
			text: "",
			x: 0,
			y: 0
		},
		
	});
	
	
	app.Mark = app.Obj.extend({
		type: "mark",
	});
	
	
	app.Waypoint = app.Obj.extend({
		type: "waypoint",
	});
	
	
	app.Undo = window.TastypieModel.extend({
		
		// Must specify in order to destroy undos after popping from collection:
		urlRoot: API_NAME + "/undo",
		
		defaults: {
			obj_pk: 0,
			text: "",
			x: 0,
			y: 0
		},
		
	});
	
	
	app.Redo = window.TastypieModel.extend({
		
		// Must specify in order to destroy redos after popping from collection:
		urlRoot: API_NAME + "/redo",
		
		defaults: {
			obj_pk: 0,
			text: "",
			x: 0,
			y: 0
		},
		
	});
	
}());