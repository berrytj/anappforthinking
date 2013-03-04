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
        
        filter: '.mark, .waypoint:not(#wp-input)',
        distance: 10,
        
        start: function(e) {
            // Modified jquery-ui source to add-to-selection when holding shift.
            // (Add-to-selection is default behavior when holding cmd / ctrl.)
            app.dragging = true;  // To prevent input field from opening due to mousedown.
            app.dispatcher.trigger('click:wall', e);
            // Update to avoid triggering this when shift-selecting:
            app.dispatcher.trigger('enable:list', false);
        },
        
        selecting: function(e, ui) {
            $(ui.selecting).find('circle').css('stroke', 'orange');
        },
        
        unselecting: function(e, ui) {
            $(ui.unselecting).find('circle').css('stroke', STROKE_COLOR);
        },
        
        stop: function() {
            if ($('.ui-selected').length) app.dispatcher.trigger('enable:list', true);
        },
        
    });
    
    var alert = 'Data is still being sent to the server.  You may lose unsaved changes if you close this page.';
    
    window.onbeforeunload = function() {
        if (app.queue.state() === 'pending') return alert;
    };
	
});

window.onload = function() {
    
//    var win = $(window);
  //  var left = ( $(document).width()  - win.width()  ) / 2;
//    var top  = ( $(document).height() - win.height() ) / 2;
//    win.scrollLeft(left);
//    win.scrollTop(top);
    
}