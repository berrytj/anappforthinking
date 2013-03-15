// Object View
// -----------

var app = app || {};

(function() {
	
	'use strict';
	
	// Object descendants include marks and waypoints.
	app.ObjectView = Backbone.View.extend({
		
		// The DOM events specific to an item.
		events: {
			'click .input' : 'doNothing',
			'click'        : 'cleanup',
		},
		
		initialize: function() {
			
			this.model.on('change', this.render, this);  // Called after editing text, performing undo, trashing...
			this.$el.data('view', this);                 // Accessed after dragging, dropping...
			app.dispatcher.on('zoom:objects', this.zoom, this);
			this.makeDraggableOnce = _.once(this.makeDraggable);
			this.AXIS_SWITCH_MAX = 100;

		},
		
		render: function() {

			var onPage = this.$el.parents().length;

			if (this.model.get('text')) {
				
				var options = _.clone(ANIMATE_UNDO);
				
				if (!onPage) {
					this.putBackOnPage(this.$el);
					options['duration'] = 0;  // Don't animate when first putting on page.
				}
				
				this.draw(options);
				this.zoomSize();
				this.shrinkwrap();
				this.makeDraggableOnce();
				
			} else {
				if (onPage) this.$el.detach();
			}
			
			return this;
		},
		
		draw: function(options) {
			
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
			
			if ($el.hasClass('ui-draggable')) $el.draggable('destroy');
			
			this.makeDraggableOnce = _.once(this.makeDraggable);
		},

		zoom: function(rel_factor) {
			
			this.zoomSize();
			this.shrinkwrap();
			
			var pos = this.$el.offset();
			
			this.$el.animate({
				
				left: pos.left * rel_factor,
				top:  pos.top  * rel_factor
				
			}, ANIM_OPTS);
			
		},
		
		updateLocation: function() {
			
			this.createUndo();
			this.saveLocation();
			
		},
		
		saveLocation: function() {
			
			var loc = this.$el.offset();
			
			this.model.save({
				
				x: Math.round( loc.left / app.factor ),
				y: Math.round( loc.top  / app.factor )
				
			}, { silent: true });  // Element has already moved
			
		},
		
		cleanup: function(e) {
			
			e.stopPropagation();
			
			this.respondToClick(e);
			this.$el.removeClass('dragged');  // Free the element to be edited next time it gets clicked.
			
			app.dispatcher.trigger('close:inputs', e);
		},
		
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
		
		clear: function() {
			
			this.createUndo();
			this.model.save({ text: "" });
			
		},
		
		setInitialDragPositions: function($obj) {
			
			// If dragging selected mark, save initial location
			// of all selected marks as basis for relative position
			// adjustments during dragging.
			
			var reference = $obj.offset();

			$('.ui-selected').each(function() {
				
				var pos = $(this).offset();
				
				$(this).data({
					x: pos.left - reference.left,
					y: pos.top  - reference.top,
				});
				
			});
		},
		
		updateDragPositions: function($obj) {
			
			var reference = $obj.offset();

			$('.ui-selected').not($obj).each(function() {  // Move all selected marks relative to their initial position.
				
				$(this).css({
					left: $(this).data('x') + reference.left,
					top:  $(this).data('y') + reference.top,
				});

			});
		},
		
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
		
		dragAlongAxis: function(e, ui, $obj) {

			var axis = $obj.draggable('option', 'axis');
			if (axis) this.holdAlongAxis($obj, axis);

			var x_diff = Math.abs(ui.position.left - this.hold_x);
			var y_diff = Math.abs(ui.position.top  - this.hold_y);
			var new_axis = (x_diff > y_diff) ? 'x' : 'y';
			var max = this.AXIS_SWITCH_MAX;

			if ( !axis || (new_axis !== axis && x_diff < max && y_diff < max) ) {
				$obj.draggable('option', 'axis', new_axis);
			}

			if (!axis) this.listenForKeyup($obj);
		},

		holdAlongAxis: function($obj, axis) {

			var prop = (axis === 'x') ? 'top' : 'left';
			var hold = (axis === 'x') ? this.hold_y : this.hold_x;
			
			$obj.get()[0].style[prop] = hold + 'px';
		},

		listenForKeyup: function($obj) {

			$(window).keyup(function(e) {

				if (!e.shiftKey) {
					$obj.draggable('option', 'axis', false);
					$(window).unbind('keyup');
				}

			});

		},

		doNothing: function(e) { e.stopPropagation(); },
		
		shrinkWrap: function() {  // In case 'W' is accidentally capitalized.
			this.shrinkwrap();
		},
		
	});

}());