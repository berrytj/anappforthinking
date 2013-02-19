var app = app || {};

// Document Ready
// --------------

$(function() {
    
    // Kick things off by creating the **App**.
	new app.AppView();
    
    // Move these into app.js or subviews?
    
    $('#trash-can').droppable({
        accept: '.ui-draggable',
        hoverClass: 'active-trash-can',
        tolerance: 'pointer',
        drop: function(e, ui) {
            app.cancelDrag = true;
            updateModels(ui.draggable, ui.draggable.data('view').clear);
        }
    });
    
    $('#wall').selectable({
        filter: '.mark, .waypoint:not(#waypoint-input)',
        distance: 10,
        start: function(e) {
            // Modified jquery-ui source to add-to-selection when holding shift.
            // (Add-to-selection is default behavior when holding cmd / ctrl.)
            app.dragging = true;  // To prevent input field from opening due to mousedown.
            app.dispatcher.trigger('wallClick', e);
            // Update to avoid triggering this when shift-selecting:
            app.dispatcher.trigger('enableList', false);
        },
        stop: function() {
            if ($('.ui-selected').length) app.dispatcher.trigger('enableList', true);
        },
    });
	
});

window.onload = function() {
    
//    var win = $(window);
  //  var left = ( $(document).width()  - win.width()  ) / 2;
//    var top  = ( $(document).height() - win.height() ) / 2;
//    win.scrollLeft(left);
//    win.scrollTop(top);
    
}