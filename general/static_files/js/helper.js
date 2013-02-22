var addToColl = function(model) {
	
	var collection;
	
	switch (model.coll) {
		case 'undo':
		    collection = app.Undos;
		    break;
		case 'redo':
		    collection = app.Redos;
		    break;
	}
	
	collection.add(model);
	
};

var updateEach = function(update, $group, savingUndos) {
    
    $group.each(function() {                    
        // Invoke the `update` function parameter, binding each object's view in turn as `this`.
        savingUndos.push( update.apply( $(this).data('view') ) );
    });
    
    return savingUndos;
};

var groupEnd = function(savingUndos) {
    
    $.when.apply(null, savingUndos).done(function() {
        app.dispatcher.trigger('undoMarker', 'group_start', app.savingGroup);
    });
    
};

var updateModels = function($obj, update, $group) {
    console.log('updating models');
    app.dispatcher.trigger('saving');
    
    if ( $obj.hasClass('ui-selected') ) {
        
        if (!$group) $group = $('.ui-selected');
        
        if ( (app.savingGroup.state()) === 'resolved' ) {
            
            app.savingGroup  = $.Deferred();
            var savingMarker = $.Deferred();
            var savingUndos  = [];
            
            app.dispatcher.trigger('undoMarker', 'group_end', savingMarker);
            
//            savingMarker.done(function() {
                savingUndos = updateEach(update, $group, savingUndos);
                groupEnd(savingUndos);
//            });
            
        }
        
    } else {
        update.apply( $obj.data('view') );
        app.dispatcher.trigger('doneSaving');
    }
    console.log('done synchronous updating');
};