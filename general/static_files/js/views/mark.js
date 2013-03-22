// Mark View
// ---------

var app = app || {};
var X_FACTOR = 1.3;
var TOP_INDEX = 9995;  // Toolbar is a z-index 9999.
var BOTTOM_INDEX = 10;
var ORIG_FONT_SIZE = 14;
var ORIG_LEFT_PADDING = 7;
var ORIG_RIGHT_PADDING = 7;
var ORIG_TOP_PADDING = 3;
var ORIG_BOTTOM_PADDING = 5;
var MARK_WIDTH = 370;
var OUTER_MARK_WIDTH = 370 + ORIG_LEFT_PADDING + ORIG_RIGHT_PADDING;
var MARK_HEIGHT = 38;
var SINGLE_ROW_HEIGHT = 25;
var ORIG_RADIUS = 6;
var NARROW = 0.8;
var MAX_BOLD = 0.7;
var MAX_NORMAL = 1;

(function() {
	
	'use strict';
	
	app.MarkView = app.ObjectView.extend({
		
		className: 'mark',
		
		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),
		
		// The DOM events specific to an item.
		events: _.extend({
			
			'click':           'respondToClick',
			'keypress .input': 'checkIfFinished',
			
		}, app.ObjectView.prototype.events),
		
		initialize: function() {

			app.ObjectView.prototype.initialize.call(this);
			app.dispatcher.on('close:inputs', this.closeInput, this);
			app.last_edited = this;
			
		},
		
		// Restyle the mark according to the app's zoom factor.
		zoomSize: function() {
			
			var style = {
				'border-radius':  app.factor * ORIG_RADIUS + 'px',
				'width':          app.factor * MARK_WIDTH + 'px',
				'padding-left':   app.factor * ORIG_LEFT_PADDING + 'px',
				'padding-right':  app.factor * ORIG_RIGHT_PADDING + 'px',
				'padding-top':    app.factor * ORIG_TOP_PADDING + 'px',
				'padding-bottom': app.factor * ORIG_BOTTOM_PADDING + 'px',
			};
			
			var weight;

			if      (app.factor < MAX_BOLD)   weight = 500;
			else if (app.factor < MAX_NORMAL) weight = 400;
			else                              weight = 300;

			this.$el.css(style);
			
			this.$('label').css({
				'font-size': app.factor * ORIG_FONT_SIZE + 'px',
				'font-weight': weight,
			});
			
			this.shrinkwrap();
		},
		
		// Resize the block element to be no bigger than the
		// inline div (so users don't drag objects accidentally).
		shrinkwrap: function() {
			this.$el.width( this.$('label').width() );
		},
		
		// Figure out proper response to mark being clicked.
		respondToClick: function(e) {
			
			var $mark = this.$el;
			
			if ($mark.hasClass('dragged')) return;  // Don't edit if the click comes at the end of a drag.
			
			(e.shiftKey || e.metaKey) ? this.toggleSelected($mark) : this.edit($mark);
		},
		
		// Figure out the correct width for an input.  We don't want it to
		// be too narrow, but we also don't want it to be too wide that text
		// re-wraps confusingly.
		inputWidth: function(height) {
			
			var current = this.$el.width();
			var zoomed = app.factor * MARK_WIDTH;
			var tooNarrow = current < zoomed * NARROW;
			var oneRow = height < SINGLE_ROW_HEIGHT;
			
			return (tooNarrow || oneRow) ? zoomed : current;
		},
		
		// Switch mark into editing mode.
		edit: function($mark) {
			
			app.dispatcher.trigger('clear:selected');
			
			$mark.css('z-index', TOP_INDEX);  // Show input above all marks.
			
			var height = $mark.height();
			var width = this.inputWidth(height);
			var that = this;
			
			setTimeout(function() {
				that.showInput(width, height);
			}, 1);  // Wait a millisecond for click to end.
		},
		
		// Style input properly so text doesn't move at all and
		// editing mode feels fully integrated into the mark.
		showInput: function(width, height) {
			
			this.$('label').fadeOut(INPUT_FADE);
			
			this.$('.input').css({ 'font-size': app.factor * ORIG_FONT_SIZE })
							.val(this.model.get('text'))
							.width(width)
							.height(height)
							.fadeIn(INPUT_FADE)
							.focus()
							.autosize();  // Call on all inputs at the beginning?
		},
		
		// Close the mark's editing mode, saving if necessary.
		closeInput: function() {
			
			var $input = this.$('.input');
			
			if ( $input.is(':visible') ) {
				
				var text = $input.val().trim();
				
				if (text) {
					
					this.saveEdit(text);
					
					var that = this;
					this.$('label').fadeIn(INPUT_FADE);
					$input.fadeOut(INPUT_FADE, function() {
						that.$el.css('z-index', BOTTOM_INDEX);
					});
					
				} else {
					this.clear();  // Clear mark if closed with no text.
				}
				
			}
			
		},
		
		// Close the input if the appropriate keys have been clicked.
		checkIfFinished: function(e) {
				if (e.metaKey || e.shiftKey) return;
				if (e.which === ENTER_KEY) this.closeInput();
		},
		
		// Update model with new text.
		saveEdit: function(new_text) {
			
			var current_text = this.model.get('text');
			
			if (current_text !== new_text) {
				
				this.createUndo();
				this.model.save({ text: new_text });
				
			}

			app.last_edited = this;
		},
		
		// Switch mark in and out of editing mode, enabling `list`
		// functionality if appropriate.
		toggleSelected: function($mark) {
			
			$mark.toggleClass('ui-selected');
			
			var num_selected = $('.ui-selected').not('.waypoint').length;
			var enable = (num_selected >= 2) ? true : false;  // At least two marks must be selected for 'list' function to work.
			app.dispatcher.trigger('enable:list', enable);
			
		},
		
	});

}());