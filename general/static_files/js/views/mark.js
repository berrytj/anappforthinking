// Mark View
// ---------

var app = app || {};
var LABEL_PADDING = 2;
var MARK_PADDING = 14;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var ORIG_INPUT_WIDTH = 380;
var X_FACTOR = 1.3;

(function() {
    
    'use strict';
    
	app.MarkView = app.ObjectView.extend({
	    
	    className: "mark",

		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),

		// The DOM events specific to an item.
		events: _.extend({
		    'click .labelBlock': 'edit',
		    'keypress .input': 'finishEditing',
		    }, app.ObjectView.prototype.events),
		
		zoomSize: function() {
		    
		    this.$('.labelBlock').css('width', app.factor * ORIG_MAX_WIDTH);
		    
		    var labelCSS = {};
		    
		    // Below 0.7 or 0.6 add serifs?
		    if(app.factor < 1) labelCSS['font-family'] = 'HelveticaNeue';
		    else               labelCSS['font-family'] = 'HelveticaNeue-Light';
		    
		    var size = app.factor * PRIMARY_FONT_SIZE;
		    labelCSS['font-size'] = size + 'px';
            
		    this.$('label').css(labelCSS);
		    this.$('.destroy').css({ 'font-size': X_FACTOR * size + 'px',
		                             'line-height': X_FACTOR * size + 'px' });
		    
		    this.shrinkwrap();
		},
		
		shrinkwrap: function() {
			var labelWidth = this.$('label').width();
			this.$('.labelBlock').width(labelWidth + LABEL_PADDING);
			this.$el.width(labelWidth + this.$('.destroy').width() + app.factor * MARK_PADDING);
		},

		// Switch this view into 'editing' mode, displaying the input field.
		edit: function(e) {
		    
		    var $mark = this.$el;
		    if($mark.hasClass('dragged')) {
		        $mark.removeClass('dragged');
		    } else {
		        this.$('.input').css('font-size', app.factor * PRIMARY_FONT_SIZE)
		                        .width(app.factor * ORIG_INPUT_WIDTH)
		                        .show()
		                        .autoGrow()  // Just call once on all '.input' at the beginning?
		                        .focus()
		                        .val(this.model.get('text'))
		                        .height($mark.height());  // Add a little padding on the height?
		    }
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		finishEditing: function(e) {
		        
		        var $input = this.$('.input');
		        if($input.is(':visible')) {
		            
		            var notClicking = !e.pageX;
		            var notEnter = !(e.which == ENTER_KEY);
		            if(notClicking && notEnter) return;
		            
			        var text = $input.val().trim();
			        
			        if(text) {
			            if(this.model.get('text') !== text) {
			                this.createUndo();
			                this.model.save({ text: text });
			            }
			            $input.hide();
			        } else {
			            this.clear();
			        }
			    
			    }
		},
		
	});

}());