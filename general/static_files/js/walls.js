var app = app || {};

// Document Ready
// --------------

$(function() {
    
    $(".input").autoGrow();
    
//    $( "#amount" ).val( "$" + $( "#slider" ).slider( "value" ) );
    
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