
var app = app || {};

// Document Ready
// --------------

$(function() {

	new app.AppView();  // Initialize the app!

	$('#trash-can').droppable({  // Not substantial enough to have its own view.

		accept:     '.ui-draggable',    // Accept only .ui-draggable objects (marks and waypoints).
		hoverClass: 'active-trash-can', // Trash can looks active when hovering over it with object.
		tolerance:  'pointer',			// Allow dropping if and only if pointer is over trash can.

		drop: function(e, ui) {
			app.cancelDrag = true;
			updateModels(ui.draggable, ui.draggable.data('view').clear);
		},

	});
	
	var alert = 'Data is still being sent to the server.  You may lose unsaved changes if you close this page.';
	
	// Let the user know if they're going to lose
	// data before they navigate away from the page.
	window.onbeforeunload = function() {
		if (app.queue.state() === 'pending') return alert;
	};
	
});

// May implement automatic scrolling to the middle of the window upon load.
window.onload = function() {
	
//    var win = $(window);
//    var left = ( $(document).width()  - win.width()  ) / 2;
//    var top  = ( $(document).height() - win.height() ) / 2;
//    win.scrollLeft(left);
//    win.scrollTop(top);
	
}