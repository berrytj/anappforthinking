// The Application
// ---------------
// There may be some lingering code from an example that I was learning from: addyosmani.github.com/todomvc/

var app = app || {};
var ENTER_KEY = 13;
var UP_KEY = 38;
var DOWN_KEY = 40;
var Z_KEY = 90;
var WALL_URL = API_NAME + '/wall/' + wall_id + '/';
var ZOOM_OUT_FACTOR = 0.8;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;
var TIME = 100;  // Go slower if you can make font size animation less choppy.
var ANIM_OPTS = { duration: TIME, queue: false };  // Animation options.
// Get items for this wall only; don't limit quantity returned (default is 20):
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };
var INPUT_OFFSET_X = 7;
var INPUT_OFFSET_Y = 4;
var WAIT_FOR_DRAG = 130;
var SPACING = 6;

(function() {
    
    'use strict';
    
	app.AppView = Backbone.View.extend({
	    
		el: 'body',
        
		// Delegated events for creating new items, and clearing completed ones.
		events: {
		    'mousedown'               : 'waitThenToggle',
			'mousedown #input'        : 'doNothing',
			'mousedown #trash-can'    : 'doNothing',
			'keypress #input'         : 'createMark',
            'keypress #waypoint-input': 'createWaypoint',
			'keydown'                 : 'checkForZoom',
			'mouseup'                 : 'resetDragging',
		},
		
		initialize: function() {
			
			this.input = this.$('#input');  // Cache input field (accessed frequently).
			this.keyDown = false;  // Used to prevent multiple zooms from holding down arrow keys.
			
			app.dispatcher = _.extend({}, Backbone.Events);  // _.extend adds the latter arg to the former.
			app.factor = 1;  // Keep track of zoom factor.
			app.dragging = false;  // Used to distinguish between click and drags.
			app.mousedown = false;
			
			app.dispatcher.on('zoom', this.zoom, this);
			app.dispatcher.on('undo', this.undo, this);
			app.dispatcher.on('lineUp', this.lineUp, this);
			app.dispatcher.on('evenlySpace', this.evenlySpace, this);
			app.dispatcher.on('clearRedos', this.clearRedos, this);
			app.dispatcher.on('clearSelected', this.clearSelected, this);
			
			// Refine this: only check for marks being edited if inputs aren't open.
			// Don't check inputs again when this is called from within toggleInput.
			app.dispatcher.on('wallClick', this.hideInputs, this);
			
			// Does calling window before app change anything?
			window.app.Marks.on('add',   this.createViewForModel, this);
			window.app.Marks.on('reset', this.addMarks, this);
			
			window.app.Waypoints.on('add',   this.createViewForModel, this);
			window.app.Waypoints.on('reset', this.addWaypoints, this);
			
			// Fetching calls 'reset' on Marks collection.
			app.Marks.fetch(FETCH_OPTS);
			app.Waypoints.fetch(FETCH_OPTS);
			app.Undos.fetch(FETCH_OPTS);
			app.Redos.fetch(FETCH_OPTS);
			
			var toolbar = new app.ToolbarView();
			var waypoint_tags = new app.WaypointTagsView();
			
			this.undoKeys();
		},
		
		lineUp: function() {
		    var $selectedMarks = this.$('.ui-selected').not('.waypoint');
		    if($selectedMarks.length) {
		        // use top one instead of first id?
		        var x = $selectedMarks.first().offset().left;
		        $selectedMarks.each(function() {
		            $(this).offset({ left: x });
		            $(this).data('view').updateLocation();
		        });
		    }
		},
		
		evenlySpace: function() {
		    
		    // .get() returns array from jQuery object:
		    var marks = this.$('.ui-selected').not('.waypoint').get();
		    
		    // Using insertion sort because array should be mostly sorted:
		    // marks higher on the screen are likely to have been created first.
		    for(var i=1; i < marks.length; i++) {
		        var j = i;
		        while(j > 0) {
		            var val = $(marks[j]).offset().top;
		            if(val < $(marks[j-1]).offset().top) {
		                var temp = marks[j];
		                marks[j] = marks[j-1];
		                marks[j-1] = temp;
		                j--;
		            } else {
		                break;
		            }
		        }
		    }
		    
		    // Use recursion here?
		    // You can pass new_y forward instead of calling $prev.offset().top each time.
		    for(var i=1; i < marks.length; i++) {
		        var $prev = $(marks[i-1]);
		        var new_y = $prev.offset().top + $prev.outerHeight() + SPACING * app.factor;
		        $(marks[i]).offset({ top: new_y })
		                   .data('view').updateLocation();
		    }
		    
		},
		
		resetDragging: function() {
		    app.dragging = false;
		    
		    // Doesn't work if user mouseup's before timeout ends (which is typical).
		    app.mousedown = false;
		    this.$('#wall').selectable('enable');
		},
		
		clearRedos: function() {
		    app.Redos.each(this.destroyModel, this);
		},
		
		destroyModel: function(model) {
		    model.destroy();
		},
		
		undoKeys: function() {
		    var view = this;
		    $(document).keydown(function(e) {
		        if(e.which === Z_KEY && e.metaKey && e.shiftKey)
			        view.undo(true);
		        else if(e.which === Z_KEY && e.metaKey)
			        view.undo(false);
	        });
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
		        
		        var coll;
		        
		        if(prev.get('type') === 'mark')
		            coll = app.Marks;
		        else if(prev.get('type') === 'waypoint')
		            coll = app.Waypoints;
		        
		        var obj = coll.get( prev.get('obj_pk') );
		        
		        other.create({ wall: WALL_URL,
                               type: obj.type,
			                 obj_pk: obj.get('id'),
			                   text: obj.get('text'),
			                      x: obj.get('x'),
			                      y: obj.get('y') });
		        
		        obj.save({ text: prev.get('text'),
		                      x: prev.get('x'),
		                      y: prev.get('y') },
		                 { success: function() {
		                        // Trigger here because 'save' took longest in trials, but check
		                        // for create/destroy to complete as well to be extra safe?
		                        app.dispatcher.trigger('undoComplete');
		                 }});
		        
		        prev.destroy();
		        
            } else {
                app.dispatcher.trigger('undoComplete');
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
                app.factor *= rel_factor;
                
                // Zoom marks and zoom page.
                app.dispatcher.trigger('zoomObjects', new_width, new_height);
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
        
		createViewForModel: function(model) {
			
			var view;
			
			if(model.type === 'mark')
			    view = new app.MarkView({ model: model });
			else if(model.type === 'waypoint')
			    view = new app.WaypointView({ model: model });
			
			this.$('#wall').append(view.el);
			view.render();
		},
		
		addMarks:     function() { app.Marks.each(this.createViewForModel, this); },
		addWaypoints: function() { app.Waypoints.each(this.createViewForModel, this); },
		
		hideInputs: function(e) {
		    
		    var open = false;
		    
		    if(this.input.is(':visible')) {
		        
		        this.createMark(e);
		        open = true;
		        
		    } else if(this.$('#waypoint-input').is(':visible')) {
		        
		        this.createWaypoint(e);
		        open = true;
		        
		    }
		    
		    return open;
		},
		
		waitThenToggle: function(e) {
		    
		    app.mousedown = true;
		    
		    var view = this;
		    
		    setTimeout(function() {
		        if(!app.dragging) view.toggleInput(e);
		    }, WAIT_FOR_DRAG);
		},
		
		toggleInput: function(e) {
		    
		    // Is either input open?
		    var open = this.hideInputs(e);
		    
		    if(!open) {
		        
		        if(this.$('.input:visible').length) {
		            // Any marks being edited?
		            app.dispatcher.trigger('wallClick', e);
		            
		        } else if(this.$('.ui-selected').length) {
		            // Any marks selected?
		            app.dispatcher.trigger('clearSelected');
		            
		        } else {
		            
		            this.showInput(e, this.input);
		            
		        }
		        
		    }
		},
		
		clearSelected: function() {
		    this.$('.ui-selected').each(function() {
                $(this).removeClass('ui-selected');
            });
		},
		
		showInput: function(e, $input) {
		    
		    if(app.mousedown)
		        this.$('#wall').selectable('disable');
		    
		    $input.css('font-size', app.factor * PRIMARY_FONT_SIZE)
		          .width(app.factor * ORIG_INPUT_WIDTH)
		          .show()
		          .offset({ left: e.pageX - INPUT_OFFSET_X,
		                    top:  e.pageY - INPUT_OFFSET_Y });
		    
		    $input.focus();
		},
		
		createMark: function(e) {
		    // Add these as arguments in 'events' up top?
		    this.createObj(e, this.input, app.Marks);
		},
		
		createWaypoint: function(e) {
		    this.createObj(e, this.$('#waypoint-input'), app.Waypoints);
		},
		
		createObj: function(e, $input, coll) {
                
                var clicking = e.pageX;
		        var enter = (e.which === ENTER_KEY);
		        
		        if(clicking || enter) {
			        var text = $input.val().trim();
			        if(text) this.createModel($input, text, coll);
			        $input.hide();
			    }
		},
		
		createModel: function($input, text, coll) {
		    
		    var loc = $input.offset();
			var attributes = { wall: WALL_URL,
			                   text: text,
			                   x: loc.left / app.factor,
			                   y: loc.top  / app.factor };
			
			coll.create(attributes, { wait: true, success: this.createEmptyUndo });
			
			$input.val('');
		},
		
		createEmptyUndo: function(model) {
			
			// Create a blank undo object so creation can be undone / redone:
			app.Undos.create({ wall: WALL_URL,
                               type: model.type,
			                 obj_pk: model.get('id'),
			                   text: '',
			                      x: 0,
			                      y: 0 });
			
			app.dispatcher.trigger('clearRedos');
		},
		
		doNothing: function(e) { e.stopPropagation(); }
        
	});
	
}());