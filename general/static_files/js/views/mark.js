// Mark View
// ---------

var app = app || {};
var LABEL_PADDING = 3;
var MARK_PADDING = 40;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var ORIG_INPUT_WIDTH = 380;
var FONT_SIZE_TO_LINE_HEIGHT = 0.4;

(function() {
    
    'use strict';
    	
	app.MarkView = Backbone.View.extend({
	    
	    className: "mark",

		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),

		// The DOM events specific to an item.
		events: {
		             'mousedown': 'cleanup',
		     'click .labelBlock': 'edit',
		       'keypress .input': 'finishEditing',
		             'mouseover': 'showX',
			'mousedown .destroy': 'clear',
		},

		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function(options) {
			
			// Update view when model changes, e.g. after editing text.
			this.model.on('change',  this.render, this);
			this.model.on('destroy', this.remove, this);
			
			this.dispatcher = options.dispatcher;
			this.dispatcher.on('wallClick', this.finishEditing, this);
			this.dispatcher.on('zoomMarks', this.zoom, this);
			
			// Keep track of zoom factor:
			this.factor = options.factor;
		},
        
		// Render the mark.
		render: function() {
		    
		    var view = this;
			this.$el.html(this.template(this.model.toJSON()))
			        .offset({ left: this.model.get('x') * this.factor,
			                  top:  this.model.get('y') * this.factor })
			        .draggable({
			            start: function() {
			                $(this).addClass('dragged')
			                       .find('.destroy').css('opacity', 0);
			            },
			            stop: function() {
			                view.updateLocation();
			            }
			         });
			
			this.zoomSize();  // Need to call every time?
			return this;
		},
		
		zoomSize: function() {
		    
		    this.$('.labelBlock').css('width', this.factor * ORIG_MAX_WIDTH);
		    
		    var labelCSS = { };
		    
		    // Below 0.7 or 0.6 add serifs?
		    if(this.factor < 1) labelCSS['font-family'] = 'HelveticaNeue';
		    else                labelCSS['font-family'] = 'HelveticaNeue-Light';
		    
		    labelCSS['font-size'] = this.factor * PRIMARY_FONT_SIZE + 'px';
            
		    this.$('label').css(labelCSS);
		    this.$('.destroy').css(labelCSS);  // Assumes destroy font is same size as label font.
		    
		    this.shrinkwrap();
		},
		
		zoom: function(factor, new_width, new_height) {
            
            this.factor = factor;
            
            var pos = this.$el.offset();
            var new_x = new_width  * (pos.left / $('#wall').width());
            var new_y = new_height * (pos.top / $('#wall').height());
            
            this.zoomSize();
            
            this.$el.animate({ left: new_x, top: new_y }, ANIM_OPTS);
		},
		
		// Shrinkwrap labelBlock around label.
		shrinkwrap: function() {
			var labelWidth = this.$('label').width();
			this.$('.labelBlock').width(labelWidth + LABEL_PADDING);
			this.$el.width(labelWidth + this.$('.destroy').width() + this.factor * MARK_PADDING);
		},
		
		showX: function(e) {
		    
		    if(!e.which) {  // If mouse is up (not dragging):
		        
		        var $x = this.$('.destroy');
		        $x.css('opacity', 1);
		        var $mark = this.$el;
		        $mark.on('mouseleave', function() {
		            $x.css('opacity', 0);
		            $mark.unbind('mouseleave');
		        });
		    
		    }
		},
		
		updateLocation: function() {
		    var loc = this.$el.offset();
		    this.createUndo();
		    this.model.save({ x: loc.left / this.factor,
		                      y: loc.top  / this.factor });
		},
		
		cleanup: function(e) {
		    e.stopPropagation();
		    
		    // FIX THIS: this closes editing when a mark is clicked,
		    // but even closes the mark you're currently editing / clicking.
//		    this.dispatcher.trigger('wallClick', e);
            
		    this.$el.removeClass('dragged');
		},

		// Switch this view into 'editing' mode, displaying the input field.
		edit: function(e) {
		    
		    var $mark = this.$el;
		    if($mark.hasClass('dragged')) {
		        $mark.removeClass('dragged');
		    } else {
		        this.$('.input').css('font-size', this.factor * PRIMARY_FONT_SIZE)
		                        .width(this.factor * ORIG_INPUT_WIDTH)
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
		
		createUndo: function() {
		    // When generalizing for waypoints, send model to app.js for undo creation?
		    // Quicker way to transfer multiple attributes?
            app.Undos.create({ wall: WALL_URL,
                               type: 'mark',
			                 obj_pk: this.model.get('id'),
			                   text: this.model.get('text'),
			                      x: this.model.get('x'),
			                      y: this.model.get('y') });
		},
		
		clear: function(e) {
		    e.stopImmediatePropagation();  // Or just normal stopProp?
//			undo, and don't actually destroy
			this.model.destroy();
		},
		
	});

}());