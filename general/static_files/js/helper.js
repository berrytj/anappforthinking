var updateModels = function($obj, func, excl) {
    
    if ( $obj.hasClass('ui-selected') ) {  // If a group was being dragged/dropped:
        
        // Double check that this always picks '' when excl is undefined,
        // and that `.not('')` does nothing.
        var excluded = excl || '';
        
        var addingMarker = $.Deferred();
        
        // Two drags in quick succession leads to a glitch where 'group_end' is
        // added twice without a 'group_start' in between. Disable dragging while
        // undo is processing?
        app.dispatcher.trigger('undoMarker', 'group_end', addingMarker);  // 'group_end' comes before 'group_start'
                                                                          // because undos will be accessed LIFO.
        // An array of jqXHR objects, each indicating
        // when an undo has finished being added:
        var addingUndos = [];
        
        // Undos must wait until the 'group_end' marker has been placed;
        // hence they wait for resolution of the `addingMarker` deferred object:
        addingMarker.done(function() {
            
            // Undos are added asynchronously to save time...
            $('.ui-selected').not(excluded).each(function() {
                addingUndos.push( func.apply( $(this).data('view') ) );
            });
            
            // ...but all must be added before placing the 'group_start' marker:
            $.when.apply(null, addingUndos).done(function() {
                app.dispatcher.trigger('undoMarker', 'group_start');
            });
            
        });
        
    } else {  // If just one object was being dragged/dropped:
        func.apply( $obj.data('view') );
    }
}