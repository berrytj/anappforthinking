var updateModels = function($obj, update, $group) {
    
    app.dispatcher.trigger('saving');
    
    if ( $obj.hasClass('ui-selected') ) {
        
        if (!$group) $group = $('.ui-selected');
        
        if ( (app.queue.state()) === 'resolved' ) {
            
            app.dispatcher.trigger('undoMarker', 'group_end');
            
            $group.each(function() {
                update.call( $(this).data('view') );
            });
            
            app.dispatcher.trigger('undoMarker', 'group_start');
        }
        
    } else {
        update.call($obj.data('view'), true);
    }
    
};