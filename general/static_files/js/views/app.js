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
var MAX_FACTOR = 160;

var INPUT_OFFSET_X = 7;
var INPUT_OFFSET_Y = 4;
var SPACING = 6;

var LIST_PAUSE = 1500;
var LIST_ANIMATE = 150;
var WAIT_FOR_DRAG = 130;
var TIME = 100;  // Go slower if you can make font size animation less choppy.
var ANIM_OPTS = { duration: TIME, queue: false };  // Animation options.

// Get items for this wall only.  Don't limit quantity returned (default is 20).
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };

var ADD_TO_COLL = { success: addToColl };


(function() {
    
    'use strict';
    
	app.AppView = Backbone.View.extend({
	    
		el: 'body',
        
		// Delegated events. Switch from mousedown to click for showing input?
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
			
			this.timeAjax();
			
			this.input = this.$('#input');  // Cache input field (accessed frequently).
			this.input.autosize();          // Input box will grow / shrink automatically.
			this.keyDown = false;           // Used to prevent multiple zooms when holding down an arrow key.
			
			app.savingGroup = $.Deferred();  // Indicates whether an undo group is still being processed.
			app.savingGroup.resolve();       // No group is being processed on startup.
			app.dispatcher = _.extend({}, Backbone.Events);  // Different views can trigger and respond to events through the dispatcher.
			app.factor = 1;         // Keep track of zoom factor.
			app.dragging = false;   // Used to distinguish between click and drags.
			app.mousedown = false;  // To disable selecting if input appears while mouse is still down.
			
			app.dispatcher.on('zoom', this.zoom, this);
			app.dispatcher.on('undo', this.undo, this);
			app.dispatcher.on('list', this.list, this);
			app.dispatcher.on('clearRedos', this.clearRedos, this);
			app.dispatcher.on('clearSelected', this.clearSelected, this);
			app.dispatcher.on('undoMarker', this.undoMarker, this);
			
			// Refine this: only check for marks being edited if inputs aren't open.
			// Don't check inputs again when this is called from within toggleInput.
			app.dispatcher.on('wallClick', this.hideInputs, this);
			
			app.Marks.on('add', this.createViewForModel, this);
			app.Marks.on('reset', this.addMarks, this);
			
			app.Waypoints.on('add', this.createViewForModel, this);
			app.Waypoints.on('reset', this.addWaypoints, this);
			
			// Fetching calls 'reset' on Marks collection.
			app.Marks.fetch(FETCH_OPTS);
			app.Waypoints.fetch(FETCH_OPTS);
			app.Undos.fetch(FETCH_OPTS);
			app.Redos.fetch({
			    data: { wall__id: wall_id, limit: 0 },
			    success: function(coll) {
			        if (!coll.length) app.dispatcher.trigger('redosEmpty');
			    }
			});
			
			// do cleanup, in case connection was lost during saving:
			// add an empty undo for any object that doesn't have one
			// maybe add a group_start at the beginning if a group_end
			// is found before a group start is found in the list?
			// anything else?
			
			var toolbar = new app.ToolbarView();
			var waypoint_tags = new app.WaypointTagsView();
			
			this.undoKeys();
		},
		
		calculateTime: function(start, type) {
		    
		    var end = new Date();
		    var time = end - start;
		    console.log(type + ': ' + time);
		    
		},
		
		timeQueued: function(a, b, c, d, e) {
		    
		    var view = this;
		    var start = new Date();
		    
		    $.Deferred().resolve()
		    .then(function() { return a.save(); })
		    .then(function() { return b.save(); })
//		    .then(function() { return c.save(); })
//		    .then(function() { return d.save(); })
//		    .then(function() { return e.save(); })
		    .done(function() { view.calculateTime(start, 'queued'); });
		    
		},
		
		timeGrouped: function(a, b, c, d, e) {
		    
		    var view = this;
		    var start = new Date();
		    
		    $.when(a.save()
		         , b.save()
//		         , c.save()
//		         , d.save()
//		         , e.save()
		    ).done(function() { view.calculateTime(start, 'grouped'); });
		    
		},
		
		timeAjax: function() {
		    
		    var a = new app.Redo({ wall: WALL_URL, type: 'group_end' });
		    var b = new app.Redo({ wall: WALL_URL, type: 'group_end' });
		    var c = new app.Redo({ wall: WALL_URL, type: 'group_end' });
		    var d = new app.Redo({ wall: WALL_URL, type: 'group_end' });
		    var e = new app.Redo({ wall: WALL_URL, type: 'group_end' });
		    
//		    this.timeQueued(a, b, c, d, e);
//		    this.timeGrouped(a, b, c, d, e);
		    
		},
		
		createViewForModel: function(model) {
			
			var view;
			if(model.type === 'mark')
			    view = new app.MarkView({ model: model });
			else if(model.type === 'waypoint')
			    view = new app.WaypointView({ model: model });
			
			if (model.get('text')) {
			    
			    this.$('#wall').append(view.el);
			    
			    // Render after appending so 'shrinkwrap' works appropriately:
			    view.render();
			}
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
		    
		    // Noted so you can disable selector if
		    // input appears while mouse is still down:
		    app.mousedown = true;
		    
		    var view = this;
		    // Showing the input and dragging both stem from the mousedown event;
		    // here we're waiting to see if the user drags before showing the input.
		    // May be removed if we decide to use the click event instead of mousedown.
		    setTimeout(function() {
		        if (!app.dragging) view.toggleInput(e);
		    }, WAIT_FOR_DRAG);
		},
		
		toggleInput: function(e) {
		    
		    // Is either input open?
		    var open = this.hideInputs(e);
		    
		    if(!open) {
		        
		        if (this.$('.input:visible').length) {
		            // Any marks being edited?
		            app.dispatcher.trigger('wallClick', e);
		            
		        } else if (this.$('.ui-selected').length) {
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
		    
		    // Prevent selector from showing up if input has already appeared:
		    if (app.mousedown) this.$('#wall').selectable('disable');
		    
		    $input.css('font-size', app.factor * PRIMARY_FONT_SIZE)
		          .width(app.factor * ORIG_INPUT_WIDTH)
		          .height(app.factor * ORIG_INPUT_HEIGHT)
		          .show()
		          .offset({
		               left: e.pageX - INPUT_OFFSET_X,
		               top:  e.pageY - INPUT_OFFSET_Y
		           });
		    
		    $input.focus();
		},
		
		createMark: function(e) {
		    // Possible to put these arguments in 'events' up top?
		    this.prepareModel(e, this.input, app.Marks);
		},
		
		createWaypoint: function(e) {
		    this.prepareModel(e, this.$('#waypoint-input'), app.Waypoints);
		},
		
		prepareModel: function(e, $input, coll) {
                
                var clicking = e.pageX;
		        var enter = (e.which === ENTER_KEY);
		        
		        if (clicking || enter) {
		            
			        var text = $input.val().trim();
			        if(text) this.createModel($input, coll, text);
			        $input.hide();
			        
			    }
		},
		
		createModel: function($input, coll, text) {
		    
		    var loc = $input.offset();
			var attributes = {
			    wall: WALL_URL,
			    text: text,
			       x: loc.left / app.factor,
			       y: loc.top  / app.factor
			};
			
			coll.create(attributes, { success: this.createEmptyUndo });
			
			$input.val('');
		},
		
		createEmptyUndo: function(model) {
			
			// Create a blank undo object so creation can be undone / redone:
			app.Undos.create({
			    wall: WALL_URL,
                type: model.type,
			  obj_pk: model.get('id'),
			    text: '',
			       x: 0,
			       y: 0
			});
			
			app.dispatcher.trigger('clearRedos');
		},
		
		undoMarker: function(type, deferred) {
		    
            app.Undos.create({
                wall: WALL_URL,
                type: type  // 'group_end' or 'group_start'
            }, {
                success: function() {
                             if (deferred) {
                                deferred.resolve();
                                if (type === 'group_start') app.dispatcher.trigger('doneSaving');
                             }
                         }
            });
        },
		
		list: function() {
		    
		    var $marks = this.$('.ui-selected').not('.waypoint');
		    
		    if($marks.length) {
		        
		        var x = $marks.first().offset().left;  // Use top mark instead of first id?
		        
		        // Align marks on the left side:
		        $marks.each(function() {
		            
		            $(this).animate({
		                left: x
		            }, {
		                duration: LIST_ANIMATE,
		                queue:    false
		            });
		            
		        });
		        
		        this.evenlySpace($marks);
		        
		        var $sample_item = $marks.first();
		        
		        // `.promise()` waits for all animations to finish:
		        $marks.promise().done(function() {
		            
		            updateModels( $sample_item,
		                          $sample_item.data('view').updateLocation,
		                          $marks );
		        });
		        
		    }
		},
		
		// Decompose this function.
		evenlySpace: function($marks) {
		    
		    // .get() returns array from jQuery object:
		    var marks = $marks.get();
		    
		    // Using insertion sort because array should be mostly sorted:
		    // marks higher on the screen are likely to have been created earlier.
		    for (var i = 1; i < marks.length; i++) {
		        var j = i;
		        while(j > 0) {  // Loop through all previous items in the array:
		            var current = marks[j];
		            var prev    = marks[j-1];
		            var y = $(current).offset().top;
		            if(y < $(prev).offset().top) {
		                // If current item is has lower y-offset
		                // than previous item, switch them:
		                var temp   = current;
		                marks[j]   = prev;
		                marks[j-1] = temp;
		                j--;
		            } else {
		                break;
		            }
		        }
		    }
		    
		    // Use recursion here?
		    var $prev = $(marks[0]);
		    var new_y = $prev.offset().top;
		    var $mark;
		    
		    for (var i = 1; i < marks.length; i++) {
		        // Add previous object y-value, previous object height,
		        // and spacing to get next object y-value.
		        new_y += $prev.outerHeight() + SPACING * app.factor;
                $mark = $(marks[i]);
		        
		        $mark.animate({
		            top: new_y
		        }, {
		            duration: LIST_ANIMATE,
		            queue:    false
		        });
		        
		        $prev = $mark;
		    }
		    
		},
		
		resetDragging: function() {
		    
		    app.dragging = false;
		    
		    app.mousedown = false;
		    this.$('#wall').selectable('enable');
		},
		
		clearRedos: function() {
		    
		    var coll  = app.Redos;
		    var model = coll.pop();
		    
            while (model) {
                model.destroy();
                model = coll.pop();
            }
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
		
		addRedo: function(redo) {
		    
		},
		
		undo: function(isRedo) {
		    
		    var Undos, Redo, Redos;
		    
		    // NOTE: Terminology here assumes an undo is being performed. If a redo
		    // is being performed, undo means redo and redo means undo (as you can
		    // see from the assignments below).  I decided to leave it undo-specific
		    // because using ambiguous names made the functions much less clear/readable.
		    
		    if (isRedo) {
		        Undos = app.Redos;  // Global redo collection
		        Redo = app.Undo;    // Undo model constructor
		        Redos = app.Undos;  // Global undo collection
		    } else {
		        Undos = app.Undos;  // Global undo collection
		        Redo = app.Redo;    // Redo model constructor
		        Redos = app.Redos;  // Global redo collection
		    }
		    
		    var undo = Undos.pop();
		    
		    if (undo) {
		        
		        app.dispatcher.trigger('saving');
		        
		        var type = undo.get('type');
		        
		        if (type === 'group_end') {
		            
		            // If type is 'group_end', connection was lost during saving;
		            // just ignore and move to the next undo.
		            this.undo(isRedo);
		            
		        } else if (type === 'group_start') {
		            
		            // 'group_end' created first because undos are accessed LIFO:
		            var marker = new Redo({ wall: WALL_URL, type: 'group_end' });
		            
		            var switchMarkers = function() {
		                
		                return $.when( marker.save({}, ADD_TO_COLL),
		                               undo.destroy() );
		            };
		            
		            var view = this;
		            switchMarkers().done(function() {
//		            app.lastGroup = app.lastGroup.then(switchMarkers).then(function() {
		                view.performUndo(Undos.pop(), Undos, Redo, Redos, []);
		            });
		            
		        } else {
		            this.performUndo(undo, Undos, Redo, Redos);
		        }
		        
		    }
		    
		},
		
		performUndo: function(undo, Undos, Redo, Redos, group) {
		        
		        var coll;
		        if      (undo.get('type') === 'mark')     coll = app.Marks;
		        else if (undo.get('type') === 'waypoint') coll = app.Waypoints;
		        
		        // Find the object that the undo refers to:
		        var pk  = undo.get('obj_pk');
		        var obj = coll.get(pk);
		        
		        // Save current object state and build a `redo` with it:
		        var current_state = {
		            wall: WALL_URL,
                    type: obj.type,
			      obj_pk: obj.get('id'),
			        text: obj.get('text'),
			           x: obj.get('x'),
			           y: obj.get('y')
			    };
			    
			    var redo = new Redo(current_state);
		        
		        // Save former state to update object with:
		        var former_state = {
		            text: undo.get('text'),
		               x: undo.get('x'),
		               y: undo.get('y')
		        };
		        
                var saving;
//                app.lastGroup = app.lastGroup.then(function() {
                
                
                
                saving = $.when( obj.save(former_state),
                                     redo.save({}, ADD_TO_COLL),
                                     undo.destroy() );
                if (group) {
                    group.push(saving);
                    this.recurseUndo(Undos, Redo, Redos, group);
		        } else {
		            saving.done(function() { app.dispatcher.trigger('doneSaving'); });
		        }
		},
		
		recurseUndo: function(Undos, Redo, Redos, group) {
		    
		    var undo = Undos.pop();
		    
		    // ignore certain starts / ends in case connection is lost during processing?
            if (undo.get('type') === 'group_end') {
		        
		        undo.destroy();
		        
		        var marker = new Redo({ wall: WALL_URL, type: 'group_start' });
		        
		        $.when.apply(null, group).done(function() {
                    
                    marker.save({}, {
                        success: function(marker) {
                                     Redos.add(marker);
		                             app.dispatcher.trigger('doneSaving');
                                 }
                    });
                    
                });
		        
		    } else {
                this.performUndo(undo, Undos, Redo, Redos, group);
            }
		},
		
		checkForZoom: function(e) {
		    
		    // Let user move up and down rows in inputs normally:
		    if (this.$('.input:visible').length) return;
		    
		    if (!this.keyDown) {  // Prevent multiple zooms from holding down arrow keys.
		        
		        this.keyDown = true;
		        
		        var view = this;
		        $(window).keyup(function() {
		            view.keyDown = false;
		            $(window).unbind('keyup');
		        });
		        
		        // Determine relative zoom factor:
		        var rel_factor;
		        if (e.which === UP_KEY) {
		            e.preventDefault();
		            rel_factor = ZOOM_IN_FACTOR;
		            this.zoom(rel_factor);
		        } else if (e.which === DOWN_KEY) {
		            e.preventDefault();
		            rel_factor = ZOOM_OUT_FACTOR;
		            this.zoom(rel_factor);
		        }
		        
		    } else if (e.which === UP_KEY || e.which === DOWN_KEY) {
		        e.preventDefault();  // Prevent arrow keys from panning the window up and down.
		    }
		},
		
		zoom: function(rel_factor) {
		    
		    // Calculate new page size:
		    var new_width  = $('#wall').width()  * rel_factor;
            var new_height = $('#wall').height() * rel_factor;
            var new_factor = app.factor * rel_factor;
            
            // Don't shrink page below window size:
            if( new_width  > $(window).width()  &&
                new_height > $(window).height() &&
                new_factor < MAX_FACTOR ) {
                
                // Update absolute zoom factor:
                app.factor = new_factor;
                
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
		
		doNothing: function(e) { e.stopPropagation(); }
        
	});
	
}());