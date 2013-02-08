// Tastypie Collection
// -------------------

(function() {
    
    'use strict';
    
    window.TastypieCollection = Backbone.Collection.extend({
        
        parse: function(response) {
            this.recent_meta = response.meta || {};
            return response.objects || response;
        }
        
    });

}());