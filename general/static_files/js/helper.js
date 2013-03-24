

// Called the passed `update` function on each
// member of the passed group of elements.
var updateEach = function(update, $group) {
	
	app.dispatcher.trigger('undoMarker', 'group_end');
	
	$group.each(function() {
		update.call( $(this).data('view') );
	});
	
	app.dispatcher.trigger('undoMarker', 'group_start');
	
};

// Initiate update calls on a group of elements,
// or on one element if no group exists.
var updateModels = function($obj, update, $group) {
	
	// Group is usually the selected objects, but
	// may be passed in as a parameter, e.g. during
	// a group undo operation.
	if ($obj.hasClass('ui-selected') || $group) {
		
		if (!$group) $group = $('.ui-selected');
		updateEach(update, $group);
		
	} else {
		update.call($obj.data('view'));
	}
	
};

// Convert received arguments into a true array,
// pop off `function` and `that` values, then
// call the function on the remaining arguments
// when the previous AJAX call completes.
var addToQueue = function() {

	app.dispatcher.trigger('saving');

	var args = Array.prototype.slice.call(arguments);
	var func = args.pop();
	var that = args.pop();
	
	// `app.queue` is a deferred object corresponding
	// to the previous AJAX call.
	app.queue = app.queue.then(function() {
		return func.apply(that, args);
	});
	
	// Update the UI when this AJAX call completes.
	app.queue.done(function() {
		
		if (app.disconnected) {

			alert('Connection lost.  Please refresh the browser.');
			// TODO: resave everything
			// app.disconnected = false;

		} else if (app.queue.state() === 'resolved') {

			app.dispatcher.trigger('saved');

		}

	});

	// Alert the user if connection has been lost and their
	// actions aren't being saved.
	app.queue.fail(function() {

		app.disconnected = true;
		alert('Connection lost.  Please refresh the browser.');

	});

};


(function($) {
	$.fn.myPlugin = function() {

	};
})(jQuery);






