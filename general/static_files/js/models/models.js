// Mark Model
// ----------

var app = app || {};
var API_NAME = '/api/v1';

(function() {
    
    'use strict';
    
    app.Obj = window.TastypieModel.extend({
        
		defaults: {
			text: '',
			x: 0,
			y: 0
		},
		
		initialize: function() {
            this.queue = $.Deferred();
            this.queue.resolve();
        },
        
        save: function(attrs, options) {
            
            var model = this;
            this.queue = this.queue.then(function() {
                return Backbone.Model.prototype.save.call(model, attrs, options);
            });
            
        },
        
    });
    
    
	app.Mark = app.Obj.extend({
		
		type: 'mark',
		
	});	
	
	
	app.Waypoint = app.Obj.extend({
	    
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
		
		coll: 'undo',
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
		
		coll: 'redo',
	});
	
}());