// The Application
// ---------------
// There may be some lingering code from an example that I was learning from: addyosmani.github.com/todomvc/

var app = app || {};
var ENTER_KEY = 13;
var UP_KEY = 38;
var DOWN_KEY = 40;
var WALL_URL = API_NAME + '/wall/' + wall_id + '/';
var ZOOM_OUT_FACTOR = 0.8;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;
var TIME = 100;  // Go slower if you can make font size animation less choppy.
var ANIM_OPTS = { duration: TIME, queue: false };  // Animation options.
// Get items for this wall only; don't limit quantity returned (default is 20):
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };

(function() {
    
    'use strict';

	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: 'body',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			       'mousedown': 'toggleInput',
			'mousedown #input': 'doNothing',
			 'keypress #input': 'createMark',
	'keypress #waypoint-input': 'createWaypoint',
			         'keydown': 'checkForZoom',
			         // keypress in waypoint-input
			         // stopprop for tags just like for toolbar
		},

		// At initialization we bind to the relevant events on the `Marks`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting marks that might be saved in *localStorage*.
		initialize: function() {
			
			this.input = this.$('#input');
			this.dispatcher = _.extend({}, Backbone.Events);
			// Keep track of zoom factor:
			this.factor = 1;
			this.keyDown = false;
			
			this.dispatcher.on('zoom', this.zoom, this);
			this.dispatcher.on('undo', this.undo, this);
			this.dispatcher.on('wallClick', this.hideInput, this);
			
			// Does calling window before app change anything?
			window.app.Marks.on('add',   this.addOne, this);
			window.app.Marks.on('reset', this.addAll, this);
			
			window.app.Waypoints.on('add',   this.addOne, this);
			window.app.Waypoints.on('reset', this.addAll, this);
			
			// Fetching calls 'reset' on Marks collection.
			app.Marks.fetch(FETCH_OPTS);
			app.Waypoints.fetch(FETCH_OPTS);
			app.Undos.fetch(FETCH_OPTS);
			app.Redos.fetch(FETCH_OPTS);
			
			var toolbar = new app.ToolbarView({ dispatcher: this.dispatcher });
			var waypoint_tags = new app.WaypointTagsView({ dispatcher: this.dispatcher });
			
/*			function undoKeys() {
	$(document).keydown(function(e) {
		if(e.which === 90 && e.metaKey && e.shiftKey) {
			performUndo("redo");
		} else if(e.which === 90 && e.metaKey) {
			performUndo("undo");
		}
	});
}*/
			
			
		},
		
		undo: function(isRedo) {
		    
		    var prev, other;
		    if(isRedo) {
		        prev = app.Redos.pop();
		        other = app.Undos;
		    } else {
		        prev = app.Undos.pop();
		        other = app.Redos;
		    }
		    
		    if(prev) {
		        
		        //decompose this once you add waypoint undos
		        if(prev.get('type') === 'mark') {
		            
		            var mark_id = prev.get('obj_pk');
		            var mark = app.Marks.get(mark_id);
		            
		            other.create({ wall: WALL_URL,
                                   type: 'mark',
			                     obj_pk: mark.get('id'),
			                       text: mark.get('text'),
			                          x: mark.get('x'),
			                          y: mark.get('y') });
		            
		            var view = this;
		            mark.save({ text: prev.get('text'),
		                           x: prev.get('x'),
		                           y: prev.get('y') },
		                      { success:function() {
		                                    // Trigger here because save took longest
		                                    // in trials, but check for create/destroy
		                                    // to complete as well to be extra safe?
		                                    view.dispatcher.trigger('undoComplete');
		                      }});
		            
		            prev.destroy();
		            
		        } else if(prev.get('type') === 'waypoint') {
		            //
		        }
		        
            } else {
                this.dispatcher.trigger('undoComplete');
            }
            
		},
		
		checkForZoom: function(e) {
		    
		    if(!this.keyDown) {  // Prevent multiple zooms from holding down arrow keys.
		        
		        this.keyDown = true;
		        
		        var view = this;
		        $(window).keyup(function() {
		            view.keyDown = false;
		            $(window).unbind('keyup');
		        });
		        
		        // Determine relative zoom factor:
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
		    
		    // Calculate new page size:
		    var new_width  = $('#wall').width()  * rel_factor;
            var new_height = $('#wall').height() * rel_factor;
            
            // Don't shrink page below window size:
            if( new_width  > $(window).width() &&
                new_height > $(window).height() ) {
                
                // Update absolute zoom factor:
                this.factor *= rel_factor;
                
                // Zoom marks and zoom page.
                this.dispatcher.trigger('zoomMarks', this.factor, new_width, new_height);
                this.resizePage(new_width, new_height);
		        this.recenterWindow(rel_factor);
		        
		    }
		},
		
		resizePage: function(new_width, new_height) {
		    $('#wall').animate({ width:  new_width  }, ANIM_OPTS);
            $('#wall').animate({ height: new_height }, ANIM_OPTS);
		},
        
        recenterWindow: function(rel_factor) {
            // Page grows/shrinks from right and bottom, so page needs to be recentered.
            
            var $w = $(window);
            // Page movement needs to be calibrated from page center,
            // rather than top-left:
            var current_x_center = $w.scrollLeft() + $w.width()/2;
            var new_x_center = rel_factor * current_x_center;
            $('html, body').animate({ scrollLeft: new_x_center - $w.width()/2 }, ANIM_OPTS);
            
            var current_y_center = $w.scrollTop() + $w.height()/2;
            var new_y_center = rel_factor * current_y_center;
            $('html, body').animate({ scrollTop: new_y_center - $w.height()/2 }, ANIM_OPTS);
        },
        
		addOne: function(model) {
		    var attributes = { model: model,
			                   factor: this.factor,
			                   dispatcher: this.dispatcher };
			var view;
			if(model.type === 'mark') view = new app.MarkView(attributes);
			else if(model.type === 'waypoint') view = new app.WaypointView(attributes);
			$('body').append(view.el);
			view.render();
		},
		
		addAll: function() {
		    // Add all items in the **Marks** collection at once.
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
		        
		        $input.css('font-size', this.factor * PRIMARY_FONT_SIZE)
		              .width(this.factor * ORIG_INPUT_WIDTH)
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
			                           text: text,
			                              x: loc.left / this.factor,
			                              y: loc.top  / this.factor };
			        app.Marks.create(attributes);
			        $input.val('');
			    }
			    
			    $input.hide();
		},
		
		createWaypoint: function(e) {
		    //merge with createmark
		    var $w = this.$('#waypoint-input');
		    if(e.which === ENTER_KEY) {
		        var text = $w.val().trim();
		        if(text) {
		            var pos = $w.offset();
		            app.Waypoints.create({ wall: WALL_URL,
		                                   text: text,
		                                   x: pos.left,
		                                   y: pos.top });
		            
		            });
		            $w.val('');
		        }
		        $w.hide();
		    }
		    
		},
		
		doNothing: function(e) { e.stopPropagation(); }

	});
	
}());