// The Application
// ---------------
// There may be some lingering code from an example that I was learning from: addyosmani.github.com/todomvc/

var app = app || {};
var ENTER_KEY = 13;
var UP_KEY = 38;
var DOWN_KEY = 40;
var API_NAME = '/api/v1';
var WALL_URL = API_NAME + '/wall/' + wall_id + '/';
var ZOOM_OUT_FACTOR = 0.8;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;
var TIME = 100;  // Faster and it's not as smooth; slower and text wrapping is too distracting.

(function() {
    
    'use strict';

	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: 'body',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'mousedown':        'toggleInput',
			'mousedown #input': 'doNothing',
			'keypress #input':  'createMark',
			'keydown':          'checkForZoom',
		},

		// At initialization we bind to the relevant events on the `Marks`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting marks that might be saved in *localStorage*.
		initialize: function() {
			
			this.input = this.$('#input');
			this.dispatcher = _.extend({}, Backbone.Events);
			
			// Keep track of absolute zoom factor:
			this.abs_factor = 1;
			this.keyDown = false;
			
			window.app.Marks.on('add', this.addOne, this);
			window.app.Marks.on('reset', this.addAll, this);
			
			this.dispatcher.on('zoom', this.zoom, this);
			this.dispatcher.on('wallClick', this.hideInput, this);
			this.dispatcher.on('undo', this.undo, this);
			this.dispatcher.on('redo', this.redo, this);
			
			// Fetching calls 'reset' on Marks collection.
			app.Marks.fetch({ data: { wall__id: wall_id, limit: 0 } });
			app.Undos.fetch({ data: { wall__id: wall_id, limit: 0 } });
			app.Redos.fetch({ data: { wall__id: wall_id, limit: 0 } });
			
			var toolbar = new app.ToolbarView({ dispatcher: this.dispatcher });
		},
		
		undo: function() {
		    
		    var undo = app.Undos.pop();
		    console.log(undo.get('type'));
		    
		    //create redo
		},
		
		redo: function() {
		    
		    var redo = app.Redos.pop();
		    console.log(redo.get('type'));
		    
		    //create undo
		},
		
		checkForZoom: function(e) {
		    
		    if(!this.keyDown) {  // Prevent multiple zooms from holding down arrow keys.
		        
		        this.keyDown = true;
		        
		        var view = this;
		        $(window).keyup(function() {
		            view.keyDown = false;
		            $(window).unbind('keyup');
		        });
		        
		        var rel_factor;
		        if(e.which === UP_KEY) {
		            e.preventDefault();
		            rel_factor = ZOOM_IN_FACTOR;
		            this.zoom(rel_factor);
		        } else if(e.which === DOWN_KEY) {
		            e.preventDefault();
		            rel_factor = ZOOM_OUT_FACTOR;
		            this.zoom(rel_factor);
		        }
		        
		    } else if(e.which === UP_KEY || e.which === DOWN_KEY) {
		        e.preventDefault();  // Prevent arrow keys from panning the window up and down.
		    }
		},
		
		zoom: function(rel_factor) {
		    
		    var new_width = $('#wall').width() * rel_factor;
            var new_height = $('#wall').height() * rel_factor;
            
            if( new_width  > $(window).width() &&
                new_height > $(window).height() ) {
                
                this.abs_factor *= rel_factor;
                
                if(rel_factor < 1) this.correctWindowLocationForZoom(rel_factor);
                
                this.dispatcher.trigger('zoomMarks', this.abs_factor, new_width, new_height);
                
                $('#wall').animate({ width: new_width }, { duration:TIME, queue:false });
                $('#wall').animate({ height: new_height }, { duration:TIME, queue:false });
                
		        if(rel_factor > 1) this.correctWindowLocationForZoom(rel_factor);
		    }
		    
//		    if(this.abs_factor * rel_factor * rel_factor < MIN_ZOOM)  grayoutzoomoutbutton;
		},
        
        correctWindowLocationForZoom: function(rel_factor) {
            
            var $w = $(window);
            
            var current_x_center = $w.scrollLeft() + $w.width()/2;
            var new_x_center = rel_factor * current_x_center;
            $('html, body').animate({ scrollLeft: new_x_center - $w.width()/2 },
                                    { duration:TIME, queue:false });
            
            var current_y_center = $w.scrollTop() + $w.height()/2;
            var new_y_center = rel_factor * current_y_center;
            $('html, body').animate({ scrollTop: new_y_center - $w.height()/2 },
                                    { duration:TIME, queue:false });
        },
        
		// Add a single mark to the set by creating a view for it, and
		// appending its element to the 'wall'.
		addOne: function(mark) {
		    
			var view = new app.MarkView({ model: mark,
			                              dispatcher: this.dispatcher,
			                              abs_factor: this.abs_factor });
			$('body').append(view.el);
			view.render();
		},

		// Add all items in the **Marks** collection at once.
		addAll: function() {
			app.Marks.each(this.addOne, this);
		},
		
		hideInput: function(e) {
		    if(this.input.is(':visible')) this.createMark(e);
		},
		
		toggleInput: function(e) {
		    
		    var $input = this.input;
		    // If the unbound input field is open:
		    if($input.is(':visible')) {
		        
		        this.createMark(e);
		        
		    // If any mark-bound input fields are open:
		    } else if($('.input:visible').length) {  // Looking at subviews -- bad?
		        
		        this.dispatcher.trigger('wallClick', e);
		    
		    // If no input fields are open:
		    } else {
		        
		        $input.css('font-size', this.abs_factor * PRIMARY_FONT_SIZE)
		              .width(this.abs_factor * ORIG_INPUT_WIDTH)
		              .show()
		              .offset({ left: e.pageX, top: e.pageY });
		        
		        // This method is called on mousedown, so focus once mouse is released:
		        $(window).mouseup(function() {
		            $input.focus();
		            $(window).unbind('mouseup');
		        });
		        
		    }
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		createMark: function(e) {
		        
		        var notClicking = !e.pageX;
		        var notEnter = !(e.which === ENTER_KEY);
		        if(notClicking && notEnter) return;
		        
		        var $input = this.input;
			    var text = $input.val().trim();
			    
			    if(text) {
			        var loc = $input.offset();
			        var attributes = { wall: WALL_URL,
			                           x: loc.left / this.abs_factor,
			                           y: loc.top / this.abs_factor,
			                           text: text };
			        // 'Wait: true' so rendered mark gets id from server. Necessary?
			        var new_mark_model = app.Marks.create(attributes, { wait: true });
			        $input.val('');
			    }
			    
			    $input.hide();
		},
		
		doNothing: function(e) { e.stopPropagation(); }

	});
	
}());