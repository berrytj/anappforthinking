// The Application
// ---------------

var app = app || {};
var ENTER_KEY = 13;
var API_NAME = '/api/v1';
var WALL_URL = API_NAME + '/wall/' + wall_id + '/';

(function() {
    
    'use strict';

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
	
}());