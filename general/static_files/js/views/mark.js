// Mark View
// ---------

var app = app || {};
var LABEL_PADDING = 2;
var MARK_PADDING = 6;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var ORIG_INPUT_WIDTH = 380;
var X_FACTOR = 1.3;

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

		// Switch this view into 'editing' mode, displaying the input field.
		edit: function(e) {
		    
		    var $mark = this.$el;
		    if($mark.hasClass('dragged')) {
		        $mark.removeClass('dragged');
		    } else {
		        
		        app.dispatcher.trigger('clearSelected');
		        
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
		        
		        // Why is this getting called so much?
		        //console.log('finish editing');
		        
		        var clicking = e.pageX;
		        var enter = (e.which == ENTER_KEY);
		        if(clicking || enter) {
		        
		            var $input = this.$('.input');
		            if($input.is(':visible')) {
		            
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
			    }
		},
		
	});

}());