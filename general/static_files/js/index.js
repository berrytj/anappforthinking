
// INDEX PAGE (WALL LIST)
// ----------------------

var index = {
	DIALOG_HEIGHT: 140,
	FORM_FADE:     200,
	WAIT_FOR_MOVE: 800,
	WAIT_FOR_OPEN: 100,
	PLUS_FADE:     50,
};

// Hide the modal dialog that confirms wall deletion.
var closeDialog = function($dialog) {

	$dialog.dialog('close');
	$(window).unbind('click');

};

// Hide the cursor once new wall input shows up for
// simplicity / clean UX in anticipation of user typing.
var hideCursor = function() {

	var $input = $('#new-wall-input');
	
	$input.focus().css('cursor', 'none');

	// Show cursor when mouse is moved again. (If we
	// bind this event without a `setTimeout`, it gets
	// invoked during click and the cursor never hides.)
	setTimeout(function() {

		$('body').mousemove(function() {
			$input.css('cursor', 'text');
			$('body').unbind('mousemove');
		});

	}, index.WAIT_FOR_MOVE);

};

// Supply the properties of the `delete wall` and `cancel`
// buttons in the `delete wall` dialog box.
var getButtons = function(id, $name_div, $dialog) {

	return {

		Yes: function() {  // Delete wall.

			// Makes a call to the server via the Tastypie API.
			$.ajax({
				url: '/api/v1/wall' + id,  // `id` is format /1/
				type: 'DELETE',
				contentType: 'application/json',
				dataType: 'json',
			});

			$name_div.remove(); // Remove wall name from list.
			closeDialog($dialog);

		},

		Cancel: function() {  // Don't delete wall.
			closeDialog($dialog);
		},

	};

};

// Close dialog if screen is clicked anywhere
// but inside dialog.
var closeOnClick = function($dialog) {

	$('.ui-dialog').click(function(e) {
		e.stopPropagation();
	});

	// Don't call right away or dialog will
	// be closed by the click that opened it.
	setTimeout(function() {

		$(window).click(function() {
			closeDialog($dialog);
		});

	}, index.WAIT_FOR_OPEN);

};

$(function() {
	
	// Show input and submit button for new wall
	// name when `add wall` button (plus sign) is clicked.
	$('#add-wall').click(function(e) {

		$(this).remove(); // Hide `add wall` button.
		
		// set guide text / style if first wall?

		$('#new-wall-form').fadeIn(index.FORM_FADE, function() { hideCursor(); });

	});
	
	// Show dialog asking for confirmation if user clicks
	// on a `delete wall` (x) button.
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

	// Show `new wall` input right away, rather than
	// `add wall` button, if no walls have been created yet.
	!$('.wall-name').length ? $('#add-wall').click() : $('#add-wall').show();

	
});



