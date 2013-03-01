var updateEach = function(update, $group) {
    
    app.dispatcher.trigger('undoMarker', 'group_end');
    
    $group.each(function() {
        update.call( $(this).data('view') );
    });
    
    app.dispatcher.trigger('undoMarker', 'group_start');
    
};

var updateModels = function($obj, update, $group) {
    
    app.dispatcher.trigger('saving');
    
    if ($obj.hasClass('ui-selected')) {
        
        if (!$group) $group = $('.ui-selected');
        updateEach(update, $group);
        
    } else {
        update.call($obj.data('view'), true);
    }
    
};