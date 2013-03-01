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
		    app.dispatcher.on('click:wall', this.finishEditing, this);
		},
		
		zoomSize: function() {
		    
		    var style = {};
		    
		    if(app.factor < 1) {
		        style['font-family'] = 'HelveticaNeue';
		    } else {
		        style['font-family'] = 'HelveticaNeue-Light';
		    }
		    
		    style['font-size'] = app.factor * PRIMARY_FONT_SIZE + 'px';
		    
		    this.$('label').css(style);
		    this.$('.labelBlock').css('width', app.factor * ORIG_MAX_WIDTH);
		    
		    this.shrinkwrap();
		},
		
		shrinkwrap: function() {
		    
			var label_width = this.$('label').width();
			
			this.$('.labelBlock').width(label_width + LABEL_PADDING);
			this.$el.width(label_width + app.factor * MARK_PADDING);
			
		},
        
		edit: function(e) {
		    
		    var $mark = this.$el;
		    
		    if ($mark.hasClass('dragged')) {
		                                       // Don't edit if the mouseup comes
		        $mark.removeClass('dragged');  // at the end of a drag operation.
		        
		    } else if (e.shiftKey || e.metaKey || e.ctrlKey) {
		        
		        this.toggleSelected($mark);
		        
		    } else {
		        
		        this.editMode($mark);
		        
		    }
		},
		
		inputWidth: function(height) {
		    
		    if (height < SINGLE_ROW_HEIGHT) {
		        return ORIG_INPUT_WIDTH;  // If mark is very short, still make input full width.
		    } else {
		        return this.$('.labelBlock').width();
		    }
		    
		},
		
		editMode: function($mark) {
		    
		    app.dispatcher.trigger('clear:selected');
		    
		    var height = $mark.height();
		    var width  = this.inputWidth(height);
		    
		    $mark.css('z-index', TOP_INDEX);  // Make sure input isn't under any marks.
		    
		    this.$('.input').css({ 'font-size': app.factor * PRIMARY_FONT_SIZE })
		                    .width(width)
		                    .height(height)
		                    .show()
		                    .focus()
		                    .val(this.model.get('text'))
		                    .autosize();  // Call on all inputs at the beginning?
		},
		
		// Close the `editing` mode, saving changes to the mark.
		finishEditing: function(e) {
		        
		        if (e.pageX || e.which === ENTER_KEY) {  // If clicking or pressing enter:
		        
		            var $input = this.$('.input');
		            
		            if ( $input.is(':visible') ) {
		                                                        // Mark was raised for editing.
		                this.$el.css('z-index', BOTTOM_INDEX);  // Move back to normal position.
		                
			            var text = $input.val().trim();
			            
			            if (text) {
			                this.saveEdit(text);
			                $input.hide();
			            } else {
			                this.clear();  // Clear mark if closed with no text.
			            }
			            
			        }
			    }
		},
		
		saveEdit: function(text) {
		    
		    var current_text = this.model.get('text');
		    
		    if (current_text !== text) {  // If text has changed:
		        
			    this.createUndo(current_text);
			    this.model.save({ text: text });
			    
			}
		    
		},
		
		toggleSelected: function($mark) {
		    
		    $mark.toggleClass('ui-selected');
		    
		    if ( $('.ui-selected').not('.waypoint').length >= 2 ) { // At least two marks must be
		        app.dispatcher.trigger('enable:list', true);        // selected for 'list' function to work.
		    } else {
		        app.dispatcher.trigger('enable:list', false);  // i.e. disable list
		    }
		    
		},
		
	});

}());