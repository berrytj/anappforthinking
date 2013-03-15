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
		
		zoomSize: function() {
			
			var mark = {};
			mark['border-radius'] = app.factor * ORIG_RADIUS + 'px';
			mark['width'] = app.factor * MARK_WIDTH;
			mark['padding-left'] = app.factor * ORIG_LEFT_PADDING + 'px';
			mark['padding-right'] = app.factor * ORIG_RIGHT_PADDING + 'px';
			mark['padding-top'] = app.factor * ORIG_TOP_PADDING + 'px';
			mark['padding-bottom'] = app.factor * ORIG_BOTTOM_PADDING + 'px';
			
			this.$el.css(mark);
			this.$('label').css({ 'font-size': app.factor * ORIG_FONT_SIZE + 'px' });
			
			this.shrinkwrap();
		},
		
		shrinkwrap: function() {
			this.$el.width( this.$('label').width() );
		},
		
		respondToClick: function(e) {
			
			var $mark = this.$el;
			
			if ($mark.hasClass('dragged')) return;  // Don't edit if the click comes at the end of a drag.
			
			(e.shiftKey || e.metaKey) ? this.toggleSelected($mark) : this.edit($mark);
		},
		
		inputWidth: function(height) {
			
			var current = this.$el.width();
			var zoomed = app.factor * MARK_WIDTH;
			var tooNarrow = current < zoomed * NARROW;
			var oneRow = height < SINGLE_ROW_HEIGHT;
			
			return (tooNarrow || oneRow) ? zoomed : current;
		},
		
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
		
		checkIfFinished: function(e) {
				if (e.metaKey || e.shiftKey) return;
				if (e.which === ENTER_KEY) this.closeInput();
		},
		
		saveEdit: function(new_text) {
			
			var current_text = this.model.get('text');
			
			if (current_text !== new_text) {
				
				this.createUndo();
				this.model.save({ text: new_text });
				
			}

			app.last_edited = this;
		},
		
		toggleSelected: function($mark) {
			
			$mark.toggleClass('ui-selected');
			
			var num_selected = $('.ui-selected').not('.waypoint').length;
			var enable = (num_selected >= 2) ? true : false;  // At least two marks must be selected for 'list' function to work.
			app.dispatcher.trigger('enable:list', enable);
			
		},
		
	});

}());