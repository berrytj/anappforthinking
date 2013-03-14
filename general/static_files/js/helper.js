var updateEach = function(update, $group) {
	
	app.dispatcher.trigger('undoMarker', 'group_end');
	
	$group.each(function() {
		update.call( $(this).data('view') );
	});
	
	app.dispatcher.trigger('undoMarker', 'group_start');
	
};

var updateModels = function($obj, update, $group) {
	
	if ($obj.hasClass('ui-selected')) {
		
		if (!$group) $group = $('.ui-selected');
		updateEach(update, $group);
		
	} else {
		update.call($obj.data('view'));
	}
	
};

var addToQueue = function() {

	app.dispatcher.trigger('saving');

	var args = Array.prototype.slice.call(arguments);
	var func = args.pop();
	var that = args.pop();
		
	app.queue = app.queue.then(function() {
		return func.apply(that, args);
	});
	
	app.queue.done(function() {
		if (app.queue.state() === 'resolved') app.dispatcher.trigger('saved');
	});

};

(function($) {
	$.fn.myPlugin = function() {



	};
})(jQuery);






