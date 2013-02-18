// Mark View
// ---------

var app = app || {};
var LABEL_PADDING = 2;
var MARK_PADDING = 6;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var ORIG_INPUT_WIDTH = 380;
var ORIG_INPUT_HEIGHT = 38;
var SINGLE_ROW_HEIGHT = 25;
var X_FACTOR = 1.3;
var TOP_INDEX = 9995;  // Toolbar is a z-index 9999.
var BOTTOM_INDEX = 10;

(function() {
    
    'use strict';
    
	app.MarkView = app.ObjectView.extend({
	    
	    className: 'mark',
        
		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),
        
		// The DOM events specific to an item.
		events: _.extend({
		    'click .labelBlock': 'edit',
		    'keypress .input': 'finishEditing',
		    }, app.ObjectView.prototype.events),
		
		initialize: function() {
		    app.ObjectView.prototype.initialize.call(this);
		    app.dispatcher.on('wallClick', this.finishEditing, this);
		},
		
		zoomSize: function() {
		    
		    this.$('.labelBlock').css('width', app.factor * ORIG_MAX_WIDTH);
		    
		    var labelCSS = {};
		    
		    if(app.factor < 1) {
		        labelCSS['font-family'] = 'HelveticaNeue';
		    } else {
		        labelCSS['font-family'] = 'HelveticaNeue-Light';
		    }
		    
		    labelCSS['font-size'] = app.factor * PRIMARY_FONT_SIZE + 'px';
		    this.$('label').css(labelCSS);
		    
		    this.shrinkwrap();
		},
		
		shrinkwrap: function() {
			var labelWidth = this.$('label').width();
			this.$('.labelBlock').width(labelWidth + LABEL_PADDING);
			this.$el.width(labelWidth + this.$('.destroy').width() + app.factor * MARK_PADDING);
		},

		// Switch this view into 'editing'
		// mode, displaying the input field:
		edit: function(e) {
		    
		    var $mark = this.$el;
		    
		    if($mark.hasClass('dragged')) {
		        // Don't edit if the mouseup comes
		        // at the end of a drag operation:
		        $mark.removeClass('dragged');
		        
		    } else if (e.shiftKey || e.metaKey || e.ctrlKey) {
		        
		        $mark.toggleClass('ui-selected');
		        
		        // At least two marks must be selected for 'list' function to work:
		        var selected_count = $('.ui-selected').not('.waypoint').length;
		        
		        if (selected_count >= 2) app.dispatcher.trigger('enableList', true);
		        else                     app.dispatcher.trigger('enableList', false);
		        
		    } else {  // Actually edit the mark:
		        
		        app.dispatcher.trigger('clearSelected');
		        
		        var height = $mark.height();
		        var width;
		        
		        // Show input at full width even if mark is just a few words:
		        if (height < SINGLE_ROW_HEIGHT) width = ORIG_INPUT_WIDTH;
		        else                            width = this.$('.labelBlock').width();
		        
		        // Make sure input shows above other marks:
		        this.$el.css('z-index', TOP_INDEX);
		        
		        this.$('.input').css({ 'font-size': app.factor * PRIMARY_FONT_SIZE })
		                        .width(width)
		                        .height(height)
		                        .show()
		                        .focus()
		                        .val(this.model.get('text'))
		                        .autosize();  // Call on all inputs at the beginning?
		    }
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		finishEditing: function(e) {
		        
		        // Why is this getting called so much?
		        //console.log('finish editing');
		        
		        var clicking = e.pageX;
		        var enter = (e.which == ENTER_KEY);
		        
		        if (clicking || enter) {  // Don't finish editing based on non-enter keypresses, of course.
		        
		            var $input = this.$('.input');
		            
		            if ($input.is(':visible')) {
		                
		                // Mark was raised for editing;
		                // move back to normal position:
		                this.$el.css('z-index', BOTTOM_INDEX);
		                
			            var text = $input.val().trim();
			            
			            if(text) {
			                
			                if (this.model.get('text') !== text) {  // If text actually changed:
			                    this.createUndo();
			                    // Change model silently and just update
			                    // label text rather than re-rendering mark:
			                    this.model.save({ text: text }, { silent: true });
			                    this.$('label').text(text);
			                }
			                $input.hide();
			                
			            } else {
			                this.clear();  // Clear mark if saved with no text.
			            }
			        }
			    }
		},
		
	});

}());