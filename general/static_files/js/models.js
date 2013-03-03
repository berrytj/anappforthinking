// Mark Model
// ----------

var app = app || {};
var API_NAME = "/api/v1";

(function() {
    
    'use strict';
    
    // Tastypie Model
    // --------------
    // Extended to clean the data from Tastypie to work with Backbone.
    
    window.TastypieModel = Backbone.Model.extend({
        
        sync: function(method, model, options) {
            
            app.dispatcher.trigger('saving');
            
            var that = this;
            app.queue = app.queue.then(function() {
                return Backbone.sync.call(that, method, model, options);
            });
            
            app.queue.done(function() {
                if (app.queue.state() === 'resolved') app.dispatcher.trigger('saved');
            });
        },
        
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