

var id;  // Wall id, format '/num/'
var wall_name;

$(function() {
	
	$('#add-wall').click(function() {
		
		$(this).remove();

		$('#new-wall-form').fadeIn(200, function() {

			$('#new-wall-input').focus();
			$('#new-wall-input').css('cursor', 'none');

			setTimeout(function() {

				$('body').mousemove(function() {

					$('#new-wall-input').css('cursor', 'text');
					$('body').unbind('mousemove');

				});

			}, 800);

		});

	});
	
	$('.about').click(function(e) {
		e.preventDefault();
		$(this).remove();
		$('#description').show();
	});
	
	$('#confirm-delete').dialog({
		resizable: false,
		height: 140,
		modal: true,
		autoOpen: false,
		draggable: false,
		buttons: {
			'Yes': function() {
				$.ajax({
					url: '/api/v1/wall' + id,
					type: 'DELETE',
					contentType: 'application/json',
					dataType: 'json'
				});
				$wall_name.remove();
				$(this).dialog('close');
			},
			'Cancel': function() {
				$(this).dialog('close');
			}
		}
	});
	
	$('.ui-dialog').find('button').each(function() {

		$(this).addClass('blue-button')
			   .width(60)
			   .css({ 'font-size':'13px', 'margin-left':'12px' });

	});
	
	$('.delete-wall').click(function(e) {

		var link = $(this).siblings(':first');
		id = link.attr('href');
		$('#confirm-delete').dialog('open');
		$('.ui-dialog').find('button').each(function() { $(this).blur(); });
		var text = '<p>Are you sure you wish to delete the wall <b>' +
				   link.text() + '</b>?';
		$('.ui-dialog-content').html(text);
		$wall_name = $(this).parents(':first');

	});
	
});