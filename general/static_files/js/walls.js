var app = app || {};
/*var ENTER_KEY = 13;
var API_NAME = '/api/v1';
var WALL_URL = API_NAME + '/wall/' + wall_id + '/';
var ZOOM_OUT_FACTOR = 0.85;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;
var LABEL_PADDING = 3;
var MARK_PADDING = 20;
var PRIMARY_FONT_SIZE = 14;
var ORIG_MAX_WIDTH = 370;
var FONT_SIZE_TO_LINE_HEIGHT = 1.43;

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}*/


// Document Ready
// --------------

$(function() {
    
    // Kick things off by creating the **App**.
	new app.AppView();
	
});

window.onload = function() {
    
    var win = $(window);
    var left = ( $(document).width() - win.width() ) / 2;
    var top = ( $(document).height() - win.height() ) / 2;
    win.scrollLeft(left);
    win.scrollTop(top);
    
}

/*
(function() {
    
    'use strict';
    
    // Tastypie Classes
	// ----------------
    
    // Use these classes to clean the data from Tastypie the way Backbone likes it.
    window.TastypieModel = Backbone.Model.extend({
        
        base_url: function() {
            var temp_url = Backbone.Model.prototype.url.call(this);
            return (temp_url.charAt(temp_url.length - 1) == '/' ? temp_url : temp_url + '/');
        },
        
        url: function() {
            return this.base_url();
        }
        
    });

    window.TastypieCollection = Backbone.Collection.extend({
        
        parse: function(response) {
            this.recent_meta = response.meta || {};
            return response.objects || response;
        }
        
    });
    
    
    // The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: 'body',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'mousedown':  'toggleInput',
			'mousedown #input': 'doNothing',
			'keypress #input':  'createMark'
		},

		// At initialization we bind to the relevant events on the `Marks`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting marks that might be saved in *localStorage*.
		initialize: function() {
			
			this.input = this.$('#input');
			this.dispatcher = _.extend({}, Backbone.Events);
			
			// Keep track of absolute zoom factor:
			this.abs_factor = 1;
			
			window.app.Marks.on('add', this.addOne, this);
			window.app.Marks.on('reset', this.addAll, this);
			
			this.dispatcher.on('zoom', this.zoom, this);
			
			// Fetching calls 'reset' on Marks collection.
			app.Marks.fetch({ data: { wall__id: wall_id, limit: 0 } });
			
			var toolbar = new app.ToolbarView({ dispatcher: this.dispatcher });
			
		},
		
		zoom: function(rel_factor) {
		    
		    var new_width = $('#wall').width()*rel_factor;
            var new_height = $('#wall').height()*rel_factor;
            
            if(new_width > $(window).width() && new_height > $(window).height()) {
                
                this.abs_factor *= rel_factor;
                
                if(rel_factor < 1) this.correctWindowLocationForZoom(rel_factor);
                         
                this.dispatcher.trigger('zoomMarks', rel_factor, this.abs_factor, new_width, new_height);
                
		        $('#wall').height(new_height);
		        $('#wall').width(new_width);
		        
		        if(rel_factor > 1) this.correctWindowLocationForZoom(rel_factor);
		        
		    }
		    
//		    if(this.abs_factor * rel_factor * rel_factor < MIN_ZOOM)  grayoutzoomoutbutton;
		    
		},
        
        correctWindowLocationForZoom: function(rel_factor) {
            
            var $w = $(window);
            
            var current_x_center = $w.scrollLeft() + $w.width()/2;
            var new_x_center = rel_factor * current_x_center;
            $w.scrollLeft(new_x_center - $w.width()/2);
            
            var current_y_center = $w.scrollTop() + $w.height()/2;
            var new_y_center = rel_factor * current_y_center;
            $w.scrollTop(new_y_center - $w.height()/2);
            
        },
        
		// Add a single mark to the set by creating a view for it, and
		// appending its element to the 'wall'.
		addOne: function(mark) {
		    
//		    alert(JSON.stringify(mark));
			var view = new app.MarkView({ model: mark, dispatcher: this.dispatcher });
			$('body').append(view.el);
			view.render(this.abs_factor);
			
		},

		// Add all items in the **Marks** collection at once.
		addAll: function() {
			app.Marks.each(this.addOne, this);
		},
		
		toggleInput: function(e) {
		    
		    var $input = this.input;
		    // If the unbound input field is open:
		    if($input.is(':visible')) {
		        
		        this.createMark(e);
		        $input.hide();
		        
		    // If any mark-bound input fields are open:
		    } else if($('.input:visible').length) {  // Looking at subviews -- bad?
		        
		        this.dispatcher.trigger('wallClick', e);
		    
		    // If no input fields are open:
		    } else {
		        
		        $input.show();
		        // Move to click location...
		        $input.offset({ left: e.pageX, top: e.pageY });
		        // and focus once mouse is released.
		        $(window).mouseup(function() {
		            $input.focus();
		            $(window).unbind('mouseup');
		        });
		        
		    }
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		createMark: function(e) {
		        
		        var notClicking = !e.pageX;
		        var notEnter = !(e.which == ENTER_KEY);
		        if(notClicking && notEnter) return;
		        
		        var $input = this.input;
			    var text = $input.val().trim();
			    
			    if(text) {
			        var loc = $input.offset();
			        //calculate true x and y after zoom factor and save those
			        var new_mark_model = app.Marks.create( { wall: WALL_URL,
			                                                 x:    loc.left,
			                                                 y:    loc.top,
			                                                 text: text },
			                                               { wait: true } );  // Wait so rendered mark gets id from server.
			        $input.val('');
			    }
			    
			    $input.hide();
		},
		
		doNothing: function(e) { e.stopPropagation(); }

	});
	
	
	// Toolbar View
	// ------------
	
	app.ToolbarView = Backbone.View.extend({
	    
	    el: "#toolbar",
	    
		// The DOM events specific to an item.
		events: {
		    'mousedown': 'doNothing',
		    'click #zoom-out':    'zoomOut',
		    'click #zoom-in':     'zoomIn',
//		    'click #undo-button': 'undo',
//		    'click #redo-button': 'redo',
		},
		
		initialize: function(options) { this.dispatcher = options.dispatcher; },
		
		zoomOut: function() { this.zoom(ZOOM_OUT_FACTOR); },
		zoomIn:  function() { this.zoom(ZOOM_IN_FACTOR);  },
		
		zoom: function(factor) { this.dispatcher.trigger('zoom', factor); },
		
//		undo:    function() { this.dispatcher.trigger('zoomIn');  },
//		redo:    function() { this.dispatcher.trigger('zoomIn');  },
        		
		doNothing: function(e) { e.stopPropagation(); }
		
	});
	
	
	// Mark View
	// ---------
	
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
	
	
	// Mark Model
	// ----------

	// Our basic **Mark** model has one attribute: `text`.
	app.Mark = window.TastypieModel.extend({
	    
		// Default attributes for the todo and ensure that each mark created
		// has 'text', 'x', and 'y' keys.
		defaults: {
			text: '',
			x: 0,
			y: 0
		}

	});
	
	
	// Mark Collection
	// ---------------
	
	var MarkSet = window.TastypieCollection.extend({

		// Reference to this collection's model.
		model: app.Mark,
		
		url: API_NAME + '/mark',
		
	});
	
	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
}());*/