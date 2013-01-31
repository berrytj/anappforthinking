$(function() {
    
    $("#add-wall").click(function() {
        $(this).remove();
        $("#new-wall-form").slideDown(200, function() {
            $("#new-wall").focus();
        });
    });
    
    $(".about").click(function(e) {
        e.preventDefault();
        $(this).remove();
        $("#description").show();
    });
    
});