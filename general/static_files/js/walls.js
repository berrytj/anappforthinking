var app = app || {};

// Document Ready
// --------------

$(function() {
    
    // Move these into app.js?
    
    $('.input').autoGrow();
    
    $('#trash-can').droppable({
        accept: '.ui-draggable',
        hoverClass: 'active-trash-can',
        tolerance: 'pointer',
        drop: function(e, ui) {
            if(ui.draggable.hasClass('ui-selected')) {
                $('.ui-selected').each(function() {
                    $(this).data('view').clear();
                });
            } else {
//              ui.draggable.addClass('dropped');
                ui.draggable.data('view').clear();
            }
        }
    });
    
    $('#wall').selectable({
        filter: '.mark, .waypoint:not(#waypoint-input)',
        distance: 10,
        start: function(e) {
            app.dragging = true;
            app.dispatcher.trigger('wallClick', e);
        },
    });
    
    // Kick things off by creating the **App**.
	new app.AppView();
	
});

window.onload = function() {
    
//    var win = $(window);
  //  var left = ( $(document).width()  - win.width()  ) / 2;
//    var top  = ( $(document).height() - win.height() ) / 2;
//    win.scrollLeft(left);
//    win.scrollTop(top);
    
}