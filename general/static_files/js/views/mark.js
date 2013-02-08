// Mark View
// ---------

var app = app || {};
var LABEL_PADDING = 3;
var MARK_PADDING = 20;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var FONT_SIZE_TO_LINE_HEIGHT = 1.43;
var ENTER_KEY = 13;
	
(function() {
    
    'use strict';
    	
	app.MarkView = Backbone.View.extend({
	    
	    className: "mark",

		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),

		// The DOM events specific to an item.
		events: {
		    'mousedown':          'stopPropagation',
		    'click label':        'edit',
		    'keypress .input':    'finishEditing',
		    'mouseover':          'showX',
			'mousedown .destroy': 'clear',
		},

		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function(options) {
			
			// Update view when model changes, e.g. ?
			this.model.on('change', this.render, this, 0);  // zoom_factor is 0 to indicate no change
			this.model.on('destroy', this.remove, this);
			
			var dispatcher = options.dispatcher;
			dispatcher.on('wallClick', this.finishEditing, this);
			dispatcher.on('zoomMarks', this.zoom, this);
			
		},

		// Render the mark.
		render: function(abs_factor) {
		    
		    var view = this;
			this.$el.html( this.template( this.model.toJSON() ) )
			        .offset({ left: this.model.get('x'), top: this.model.get('y') })
			        .draggable({
			            start: function() {
			                $(this).addClass('dragged')
			                       .find('.destroy').css('opacity', 0);
			            },
			            stop: function() { view.updateLocation(); }
			         });
			
			if(abs_factor) this.zoomSize(abs_factor);
            this.shrinkwrap();
			return this;
		},
		
		zoomSize: function(abs_factor) {
		    
		    // Adjust width.
            this.$('.labelBlock').css('width', abs_factor * ORIG_MAX_WIDTH);
            
            // Adjust font size.
		    var new_size = abs_factor * PRIMARY_FONT_SIZE;
		    var css = { 'font-size'  : new_size + 'px',
		                'line-height': new_size * FONT_SIZE_TO_LINE_HEIGHT + 'px' };
		    this.$('label').css(css);
		    this.$('.destroy').css(css);  // Assumes destroy font is same size as label font.
		    
		},
		
		zoom: function(rel_factor, abs_factor, new_width, new_height) {
            
            var pos = this.$el.offset();
            var new_x = new_width * ( pos.left / $('#wall').width() );
            var new_y = new_height * ( pos.top / $('#wall').height() );
            this.$el.offset({ left: new_x, top: new_y });
            
            this.zoomSize(abs_factor);
            this.shrinkwrap();
            
		},
		
		// Shrinkwrap labelBlock around label.
		shrinkwrap: function() {
			var labelWidth = this.$('label').width();
			this.$('.labelBlock').width(labelWidth + LABEL_PADDING);
			this.$el.width(labelWidth + this.$('.destroy').width() + MARK_PADDING);
		},
		
		showX: function(e) {
		    
		    if(!e.which) {  // Only show X if mouse is up (not dragging).
		        
		        var $mark = this.$el;
		        var $x = this.$('.destroy');
		        
		        $x.css('opacity', 1);
		        
		        $mark.on('mouseleave', function() {
		            $x.css('opacity', 0);
		            $mark.unbind('mouseleave');
		        });
		    
		    }
		    
		},
		
		updateLocation: function() {
		    var loc = this.$el.offset();
		    this.model.save({ x: loc.left, y: loc.top });
		},
		
		stopPropagation: function(e) {
		    e.stopPropagation();
		},

		// Switch this view into 'editing' mode, displaying the input field.
		edit: function(e) {
		    
		    var $mark = this.$el;
		    
		    if($mark.hasClass('dragged')) {
		        $mark.removeClass('dragged');
		    } else {
		        this.$('.input').show()
		                        .focus()
		                        .val(this.model.get('text'));
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
			            this.model.save({ text:text });
			            $input.hide();
			        } else {
			            this.clear();
			        }
			    
			    }
			    
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function(e) {
		    
		    e.stopImmediatePropagation();
			this.model.destroy();
			
		},
		
	});

}());