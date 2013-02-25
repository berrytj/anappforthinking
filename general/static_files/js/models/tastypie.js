// Tastypie Model
// --------------
// Extended to clean the data from Tastypie to work with Backbone.

(function() {
    
    'use strict';

    window.TastypieModel = Backbone.Model.extend({
        
        sync: function(method, model, options) {
            
            var that = this;
            
            app.queue = app.queue.then(function() {
                return Backbone.sync.call(that, method, model, options);
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

}());