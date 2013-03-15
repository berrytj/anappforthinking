

var index = {
	DIALOG_HEIGHT: 140,
	FORM_FADE:     200,
	WAIT_FOR_MOVE: 800,
	WAIT_FOR_OPEN: 100,
	PLUS_FADE:     50,
};

var closeDialog = function($dialog) {

	$dialog.dialog('close');
	$(window).unbind('click');

};

var hideCursor = function() {

	var $input = $('#new-wall-input');
	
	$input.focus().css('cursor', 'none');

	setTimeout(function() {

		$('body').mousemove(function() {
			$input.css('cursor', 'text');
			$('body').unbind('mousemove');
		});

	}, index.WAIT_FOR_MOVE);

};

var getButtons = function(id, $name_div, $dialog) {

	return {

		Yes: function() {
				
			$.ajax({
				url: '/api/v1/wall' + id,
				type: 'DELETE',
				contentType: 'application/json',
				dataType: 'json',
			});

			$name_div.remove();
			closeDialog($dialog);

		},

		Cancel: function() {
			closeDialog($dialog);
		},

	};

};

var closeOnClick = function($dialog) {

	$('.ui-dialog').click(function(e) {
		e.stopPropagation();
	});

	setTimeout(function() {

		$(window).click(function() {
			closeDialog($dialog);
		});

	}, index.WAIT_FOR_OPEN);

};

$(function() {
	
	$('#add-wall').click(function(e) {

		$(this).remove();
		// set guide text / style if first wall?
		$('#new-wall-form').fadeIn(index.FORM_FADE, function() { hideCursor(); });

	});
	
	$('.delete-wall').click(function(e) {

		var $name = $(this).siblings('a');
		var $dialog = $('#confirm-delete');
		var buttons = getButtons($name.attr('href'), $(this).parents().first(), $dialog);
		var text = '<p>Are you sure you wish to delete the wall <b>' + $name.text() + '</b>?</p>';
		
		$dialog.dialog('option', 'buttons', buttons).dialog('open');
		$('.ui-dialog-content').html(text);
		closeOnClick($dialog);

	});

	$('#confirm-delete').dialog({

		resizable: false,
		height:    index.DIALOG_HEIGHT,
		modal:     true,
		autoOpen:  false,
		draggable: false,
		position:  { my: 'center bottom', at: 'center' },
		
	});

	!$('.wall-name').length ? $('#add-wall').click() : $('#add-wall').show();

	
});

