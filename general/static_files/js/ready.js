
var app = app || {};

// Document Ready
// --------------

$(function() {
		
	new app.AppView();  // Initialize the app!

	$('#trash-can').droppable({  // Not substantial enough to have its own view.

		accept: '.ui-draggable',
		hoverClass: 'active-trash-can',
		tolerance: 'pointer',

		drop: function(e, ui) {
			app.cancelDrag = true;
			updateModels(ui.draggable, ui.draggable.data('view').clear);
		},

	});
	
	var alert = 'Data is still being sent to the server.  You may lose unsaved changes if you close this page.';
	
	window.onbeforeunload = function() {
		if (app.queue.state() === 'pending') return alert;
	};
	
});

window.onload = function() {
	
//    var win = $(window);
//    var left = ( $(document).width()  - win.width()  ) / 2;
//    var top  = ( $(document).height() - win.height() ) / 2;
//    win.scrollLeft(left);
//    win.scrollTop(top);
	
}