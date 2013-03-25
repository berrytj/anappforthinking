// Object View
// -----------

var app = app || {};

(function() {
	
	'use strict';
	
	// Object view is extended by `mark` and `waypoint` views.
	app.ObjectView = Backbone.View.extend({
		
		events: {
			'click .input' : 'doNothing',  // Don't do anything when input is clicked.
			'click'        : 'cleanup',
		},
		
		initialize: function() {
			
			// Update view when model changes.
			this.model.on('change', this.render, this);  // Called after editing text, performing undo, trashing...
			
			// Give jQuery element a pointer to its view.
			this.$el.data('view', this);  // Accessed after dragging, dropping...

			// Subscribe to 'zoom:objects' event.
			app.dispatcher.on('zoom:objects', this.zoom, this);

			 // Don't makeDraggable every time the mark gets rendered.
			this.makeDraggableOnce = _.once(this.makeDraggable);

			// Don't switch from dragging along x-axis to
			// dragging along y-axis unless within this many
			// pixels of the drag origin.
			this.AXIS_SWITCH_MAX = 100;
		},
		

		render: function() {

			// Find out if element is attached to page.
			var onPage = this.$el.parents().length;

			// Only draw if model has text.
			if (this.model.get('text')) {
				
				// Save animation options as a clone (so they can be
				// modified without modifying the original).
				var options = _.clone(ANIMATE_UNDO);
				
				// Add to page if not currently attached.
				if (!onPage) {
					this.putBackOnPage(this.$el);
					options['duration'] = 0;  // Don't animate when first putting on page.
				}
				
				this.draw(options);
				this.zoomSize();		   // Zoom properly.
				this.shrinkwrap();  	   // Size properly after zoom.
				this.makeDraggableOnce();  // Make draggable (only gets called the first time).
				
			} else {

				// Detach element from page if it has no text, so we
				// don't get slowed down by calling transformations on it.
				if (onPage) this.$el.detach();
			}
			
			return this;
		},
		
		draw: function(options) {
			
			// Feed model to template to get HTML for element.
			var html = this.template(this.model.toJSON());

			this.$el.html(html)
					.animate({
						left: Math.round(this.model.get('x') * app.factor),
						top:  Math.round(this.model.get('y') * app.factor)
					}, options);
		},
		

		putBackOnPage: function($el) {

			$el.appendTo('#wall')
			   .removeClass('ui-draggable-dragging dragged dropped');
			
			// Need to destroy and recreate draggable once
			// object has been detached from page.
			if ($el.hasClass('ui-draggable')) $el.draggable('destroy');
			this.makeDraggableOnce = _.once(this.makeDraggable); // Enable makeDraggable function.
		},

		zoom: function(rel_factor) {
			
			// Don't zoom if object has no text.
			if (this.model.get('text') === '') return;

			this.zoomSize();
			this.shrinkwrap();
			
			var pos = this.$el.offset();
			
			// Move to new location based on expansion/contraction of page.
			this.$el.animate({
				
				left: pos.left * rel_factor,
				top:  pos.top  * rel_factor
				
			}, ANIM_OPTS);
			
		},
		
		updateLocation: function() {
			
			this.createUndo();
			this.saveLocation();
			
		},
		
		// Update model / DB with current location of object.
		saveLocation: function() {
			
			var loc = this.$el.offset();
			
			this.model.save({
				
				// Divide by `app.factor` so all saved
				// coordinates can be compared to each other.
				x: Math.round( loc.left / app.factor ),
				y: Math.round( loc.top  / app.factor )
				
			}, { silent: true });  // Element has already moved.
			
		},
		
		cleanup: function(e) {
			
			e.stopPropagation();
			
			this.respondToClick(e);
			this.$el.removeClass('dragged');  // Free the element to be edited when next clicked.
			
			app.dispatcher.trigger('close:inputs', e);
		},
		
		// Save the current state of the object model into an
		// undo model before updating the object's state.
		createUndo: function() {
			
			app.dispatcher.trigger('clear:redos');
			
			// Quicker way to transfer multiple attributes?
			// Have undo and mark both extend object model?
			var current_state = {
				wall: WALL_URL,
				type: this.model.type,
			  obj_pk: this.model.get('id'),
				text: this.model.get('text'),
				   x: this.model.get('x'),
				   y: this.model.get('y')
			};
			
			app.Undos.create(current_state);
		},
		
		// Clear the model's text, resulting in the
		// object being cleared from the screen during
		// the ensuing `render` operation.
		clear: function() {
			
			this.createUndo();
			this.model.save({ text: "" });
			
		},
		
		// If dragging a selected mark, save the location
		// of the other selected marks (relative to the mark
		// being dragged) so their positions can be updated
		// during the dragging operation.
		setInitialDragPositions: function($obj) {
			
			// $obj is the object being dragged.
			var reference = $obj.offset();

			$('.ui-selected').each(function() {
				
				var pos = $(this).offset();
				
				// Storing the relative locations in each
				// element's jQuery `data` property.
				$(this).data({
					x: pos.left - reference.left,
					y: pos.top  - reference.top,
				});
				
			});
		},
		
		// Add the position of the object being dragged
		// to each element's saved offset amounts and
		// update each element's location with the result.
		updateDragPositions: function($obj) {
			
			var reference = $obj.offset();

			$('.ui-selected').not($obj).each(function() {
				
				$(this).css({
					left: reference.left + $(this).data('x'),
					top:  reference.top  + $(this).data('y'),
				});

			});
		},
		
		// Make object draggable, providing for group dragging,
		// dragging along an axis, and updating position upon drag-stop.
		makeDraggable: function() {
			
			var that = this;
			
			this.$el.draggable({
				
				start: function(e, ui) {
					
					app.dragging = true;          // To prevent input field from opening due to click.
					$(this).addClass('dragged');  // To prevent mark from going into edit mode once the drag ends / mouse is lifted.
					that.hold_x = ui.position.left;
					that.hold_y = ui.position.top;
					
					if ($(this).hasClass('ui-selected')) {
						that.setInitialDragPositions($(this));
					} else {
						app.dispatcher.trigger('clear:selected');
					}
				},
				
				drag: function(e, ui) {

					if (e.shiftKey) that.dragAlongAxis(e, ui, $(this));

					if ($(this).hasClass('ui-selected')) that.updateDragPositions($(this));
				},
				
				stop: function() {
					
					$(this).draggable('option', 'axis', false);

					if (app.cancelDrag === true) {
						app.cancelDrag = false;
					} else {
						updateModels($(this), that.updateLocation);
					}
					
				}
				
			});
		},
		
		// Hold along axis while dragging, switching axes if
		// object is brought closer to disabled axis than enabled
		// axis, provided that the object is within AXIS_SWITCH_MAX
		// of the drag origin. (When user is farther from the drag
		// origin, we don't want them to have to worry about
		// accidentally switching axes.)
		dragAlongAxis: function(e, ui, $obj) {

			var axis = $obj.draggable('option', 'axis');
			if (axis) this.holdAlongAxis($obj, axis);

			var x_diff = Math.abs(ui.position.left - this.hold_x);
			var y_diff = Math.abs(ui.position.top  - this.hold_y);
			var new_axis = (x_diff > y_diff) ? 'x' : 'y';
			var max = this.AXIS_SWITCH_MAX;

			if (!axis || (new_axis !== axis && x_diff < max && y_diff < max)) {
				$obj.draggable('option', 'axis', new_axis);
			}

			if (!axis) this.listenForKeyup($obj);
		},

		// Store original x and y positions in view variables,
		// and prevent movement along disabled axis.
		holdAlongAxis: function($obj, axis) {

			var prop = (axis === 'x') ? 'top' : 'left';
			var hold = (axis === 'x') ? this.hold_y : this.hold_x;
			
			$obj.get()[0].style[prop] = hold + 'px';
		},

		// Release axis holding if shift key is lifted during drag.
		listenForKeyup: function($obj) {

			$(window).keyup(function(e) {

				if (!e.shiftKey) {
					$obj.draggable('option', 'axis', false);
					$(window).unbind('keyup');
				}

			});

		},
		
		// Call `shrinkwrap` anyway if 'W' is
		// accidentally capitalized in function call.
		shrinkWrap: function() {
			this.shrinkwrap();
		},

		// Don't let click propagate / trigger events in other views.
		doNothing: function(e) { e.stopPropagation(); },
		
	});

}());