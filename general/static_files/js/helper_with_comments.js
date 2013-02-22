var updateModels = function($obj, func, $group) {
    
    if ( $obj.hasClass('ui-selected') ) {  // If a group was being dragged/dropped:
        
      if(!$group) $group = $('.ui-selected');
        
      app.queue.then(function() {
        
        var firstMarker  = $.Deferred();
        var secondMarker = $.Deferred();
        
        console.log('group end -- shouldn\'t come again until after group start');
        app.dispatcher.trigger('undoMarker', 'group_end', firstMarker);  // 'group_end' comes before 'group_start'
                                                                         // because undos will be accessed LIFO.
        // An array of jqXHR objects, each indicating
        // when an undo has finished being added:
        var addingUndos = [];
        
        // Undos must wait until the 'group_end' marker has been placed;
        // hence they wait for resolution of the `addingMarker` deferred object:
        firstMarker.done(function() {
            
            // Undos are added asynchronously to save time...
            $group.each(function() {
                // We got `func` from one particular view; here we're
                // applying it to a group of views, specifying each view
                // in turn to be `this` within the function.
                addingUndos.push( func.apply( $(this).data('view') ) );
            });
            
            // ...but all must be added before placing the 'group_start' marker:
            $.when.apply(null, addingUndos).done(function() {
                console.log('group start -- should be at the end');
                app.dispatcher.trigger('undoMarker', 'group_start', secondMarker);
            });
            
        });
        
        return secondMarker;
        
      });
        
    } else {  // If just one object was being dragged/dropped:
        func.apply( $obj.data('view') );
    }
    
};