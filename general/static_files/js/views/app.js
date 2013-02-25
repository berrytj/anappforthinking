// The Application
// ---------------
// There may be some lingering code from an example that
// I was learning from: addyosmani.github.com/todomvc/

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
var ANIM_OPTS = { duration: TIME, queue: true };  // Animation options.
var EXTRA = 1.2;
                                                             // Get items for this wall only.  Don't 
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };  // limit quantity returned (default is 20).


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
		
	  //////////////////////////////
	  // ***** INITIALIZING ***** //
	  //////////////////////////////
		
		initialize: function() {
			
			this.setViewVariables();
			this.setAppVariables();
			this.listen();
			this.populate();
			
			new app.ToolbarView();
			new app.WaypointTagsView();
			
		},
		
		setViewVariables: function() {
		    
		    this.input = this.$('#input');  // Cache input field (accessed frequently).
			this.input.autosize();          // Input box will grow / shrink automatically.
			this.keyDown = false;           // Used to prevent multiple zooms when holding down an arrow key.
		    
		},
		
		setAppVariables: function() {
		    
			app.factor = 1;          // Keep track of zoom factor.
			app.dragging  = false;   // To distinguish between click and drags.
			app.mousedown = false;   // To disable selecting if input appears while mouse is still down.
		    app.queue = $.Deferred();
			app.queue.resolve();
		    
		},
		
		populate: function() {
		    
		    var callback = function(coll) {
		        if (!coll.length) app.dispatcher.trigger('redos:empty');
			};
		    
		    app.Marks.fetch(FETCH_OPTS);
			app.Waypoints.fetch(FETCH_OPTS);
			app.Undos.fetch(FETCH_OPTS);
			app.Redos.fetch( _.extend(FETCH_OPTS, { success: callback }) );
		    
		},
		
		listen: function() {
		    
		    this.listenToCollection(app.Marks);
			this.listenToCollection(app.Waypoints);
			
			this.listenToUndoKeys();
		    
		    var d = app.dispatcher = _.extend({}, Backbone.Events);  // Use extend to clone other objects?
		    
		    d.on('zoom', this.zoom, this);
			d.on('undo', this.undo, this);
			d.on('list', this.list, this);
			d.on('clear:redos', this.clearRedos, this);
			d.on('clear:selected', this.clearSelected, this);
			d.on('undoMarker', this.undoMarker, this);
			// Refine this: only check for marks being edited if inputs aren't open.
			// Don't check inputs again when this is called from within toggleInput.
			d.on('click:wall', this.hideInputs, this);
		    
		},
		
		listenToCollection: function(coll) {
		    
		    coll.on('add',   this.createViewForModel, this);
		    coll.on('reset', this.renderCollection,   this);
		    
		},
		
		createViewForModel: function(model) {
			
			if (model.get('text')) {
			    
			    var constructor = (model.type === 'mark') ? app.MarkView : app.WaypointView;
			    var view = new constructor({ model: model });			    
			    $('#wall').append(view.el);                   // Render after appending so
			    view.render();                                // `shrinkwrap` works appropriately.
			    
			}
		},
		
		renderCollection: function(coll) {
		    coll.each(this.createViewForModel, this);
		},
		
		listenToUndoKeys: function() {
		    
		    var view = this;
		    
		    $(document).keydown(function(e) {
		        
		        if (e.which === Z_KEY && e.metaKey && e.shiftKey) {
			        view.undo('redo');
		        } else if (e.which === Z_KEY && e.metaKey) {
			        view.undo();
			    }
			    
	        });
	        
		},
		
	  /////////////////////////////
	  // ***** INTERACTING ***** //
	  /////////////////////////////
		
		hideInputs: function(e) {
		    
		    var open;
		    
		    open = this.closeInput(e, this.input);
		    if (!open) open = this.closeInput(e, this.$('#waypoint-input'));
		    
		    return open;
		    
		},
		
		closeInput: function(e, $input) {
		    
		    if ($input.is(':visible')) {
		        this.checkForNewModel(e, $input);
		        return true;
		    }
		    
		},
		
		waitThenToggle: function(e) {
		                               // Noted so you can disable selector if
		    app.mousedown = true;      // input appears while mouse is still down.
		    
		    var view = this;
		    // Showing the input and dragging both stem from the mousedown event;
		    // here we're waiting to see if the user drags before showing the input.
		    // May be removed if we decide to use the click event instead of mousedown.
		    setTimeout(function() {
		        if (!app.dragging) view.toggleInput(e);
		    }, WAIT_FOR_DRAG);
		},
		
		toggleInput: function(e) {
		    
		    var open = this.hideInputs(e);
		    
		    if (!open) {  // Is either input open?
		        
		        if ($('.input:visible').length) {  // Any marks being edited?
		            app.dispatcher.trigger('click:wall', e);  
		        } else if ($('.ui-selected').length) {  // Any marks selected?
		            app.dispatcher.trigger('clear:selected');
		        } else {
		            this.showInput(e);
		        }
		        
		    }
		},
		
		clearSelected: function() {
		    
		    this.$('.ui-selected').each(function() {
                $(this).removeClass('ui-selected');
            });
            
		},
		
		showInput: function(e) {
		                                                          // Prevent selector from showing up
		    if (app.mousedown) $('#wall').selectable('disable');  // if input has already appeared.
		    
		    var $input = this.input;
		    
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
		
	  //////////////////////////////////
	  // ***** CREATING OBJECTS ***** //
	  //////////////////////////////////
		
		createMark: function(e) {
		    // This fires on keypress: see if you can figure out how to
		    // get $(this) despite backbone handling (research jquery delegate).
		    this.checkForNewModel(e, this.input);
		},
		
		createWaypoint: function(e) {
		    this.checkForNewModel(e, this.$('#waypoint-input'));
		},
		
		checkForNewModel: function(e, $input) {
            
            var clicking = e.pageX;
		    
		    if (clicking || e.which === ENTER_KEY) {
		        
			    var text = $input.val().trim();
			    if (text) this.createModel($input, text);
			    $input.hide();
			    
			}
		},
		
		createModel: function($input, text) {
		    
		    var loc = $input.offset();
		    
			var attributes = {
			    wall: WALL_URL,
			    text: text,
			    x:    loc.left / app.factor,
			    y:    loc.top  / app.factor
			};
			
			var coll = ($input == this.input) ? app.Marks : app.Waypoints;
			
			coll.create(attributes, { success: this.createEmptyUndo });
			
			$input.val('');
		},
		
		createEmptyUndo: function(model) {
			                              // Create a blank undo so object
			app.Undos.create({            // creation can be undone / redone.
			    
			    wall:   WALL_URL,
                type:   model.type,
			    obj_pk: model.get('id'),
			    text:   '',
			    x:      0,
			    y:      0
			    
			});
			
			app.dispatcher.trigger('clear:redos');
		},
		
		undoMarker: function(type) {
		    
            app.Undos.create({
                
                wall: WALL_URL,
                type: type      // 'group_end' or 'group_start'
                
            }, {
                success: function() {
                            if (type === 'group_start') app.dispatcher.trigger('saved');
                         }
            });
        },
		
	  /////////////////////////
	  // ***** LISTING ***** //
	  /////////////////////////
		
		leftAlignMarks: function($marks) {
		    
		    var x = $marks.first().offset().left;  // Use top mark instead of first id?
		    
		    $marks.each(function() {
		        
		        $(this).animate({
		            left: x
		        }, {
		            duration: LIST_ANIMATE,
		            queue:    false
		        });
		        
		    });
		    
		},
		
		list: function() {
		    
		    var $marks = this.$('.ui-selected').not('.waypoint');
		    
		    if($marks.length) {
		        
		        this.leftAlignMarks($marks);
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
		
		sortMarksByTop: function(marks) {
		    
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
		    
		    return marks;
		    
		},
		
		evenlySpace: function($marks) {
		    
		    var marks = this.sortMarksByTop( $marks.get() );
		    
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
		
	  /////////////////////////
	  // ***** UNDOING ***** //
	  /////////////////////////
		
		undo: function(isRedo) {
		    
		    // NOTE: Terminology here assumes an undo is being performed. If a redo
		    // is being performed, undo means redo and redo means undo (as you can
		    // see from the assignments below).  I decided to leave it undo-specific
		    // because using ambiguous names made the functions much less clear/readable.
		    
		    var Undos, Redos;
		    
		    if (isRedo) {
		        Undos = app.Redos;  // Global redo collection
		        Redos = app.Undos;  // Global undo collection
		    } else {
		        Undos = app.Undos;  // Global undo collection
		        Redos = app.Redos;  // Global redo collection
		    }
		    
		    var undo = Undos.pop();
		    
		    if (undo) {
		        
		        var type = undo.get('type');
		        
		        if (type === 'group_end') {
		            
		            console.log('broken');
		            // If type is 'group_end', connection was lost during saving;
		            // just ignore and move to the next undo.
		            this.undo(isRedo);
		            
		        } else if (type === 'group_start') {
		            
		            undo.destroy();
		            Redos.create({ wall: WALL_URL, type: 'group_end' });
		            this.performUndo(Undos.pop(), Undos, Redos, true);
		            
		        } else {
		            this.performUndo(undo, Undos, Redos);
		        }
		        
		    }
		    
		},
		
		currentState: function(obj) {
		    return {
		        wall:   WALL_URL,
                type:   obj.type,
			    obj_pk: obj.get('id'),
			    text:   obj.get('text'),
			    x:      obj.get('x'),
			    y:      obj.get('y')
			};		    
		},
		
		formerState: function(undo) {
		    return {
		        text: undo.get('text'),
		        x:    undo.get('x'),
		        y:    undo.get('y')
		    };
		},
		
		getUndoColl: function(type) {
		    
		    if (type === 'mark') {
		        return app.Marks;
		    } else if (type === 'waypoint') {
		        return app.Waypoints;
		    }
		    
		},
		
		performUndo: function(undo, Undos, Redos, group) {
		        
		        var coll = this.getUndoColl( undo.get('type') );
		        var obj  = coll.get( undo.get('obj_pk') );
                
                Redos.create( this.currentState(obj) );
                obj.save( this.formerState(undo) );
                undo.destroy({
                    success: function() {
                                if (!group) app.dispatcher.trigger('saved:undo');
                             }
                });
                
                if (group) this.recurseUndo(Undos, Redos);
		},
		
		recurseUndo: function(Undos, Redos) {
		    
		    var undo = Undos.pop();
		    
            if (undo.get('type') === 'group_end') {
		        
		        undo.destroy();
		        Redos.create({
		            wall: WALL_URL,
		            type: 'group_start'
		        }, {
		            success: function() {
		                app.dispatcher.trigger('saved:undo');
		            }
		        });
		        
		    } else {
                this.performUndo(undo, Undos, Redos, true);
            }
		},
		
	  /////////////////////////
	  // ***** ZOOMING ***** //
	  /////////////////////////
		
		checkForZoom: function(e) {
		    
		    if (e.which === UP_KEY || e.which === DOWN_KEY) {
		        
		        if (this.$('.input:visible').length) return;  // Don't zoom when editing a mark.
		        
		        e.preventDefault();   // Prevent arrow keys from panning the window up and down.
		        
		        if (!this.keyDown) {  // Prevent multiple zooms when holding down arrow keys.
		            
		            this.keyDown = true;
		            this.listenForKeyup();
		            
		            this.zoom( (e.which === UP_KEY) ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR );
		            
		        }
		        
		    }
		},
		
		listenForKeyup: function() {
		    
		    var view = this;
		    
		    $(window).keyup(function() {
		        
		        view.keyDown = false;
		        $(window).unbind('keyup');
		        
		    });
		},
		
		zoom: function(rel_factor) {
		    
		    var $wall = $('#wall');
		    
		    var new_width  = $wall.width()  * rel_factor;
            var new_height = $wall.height() * rel_factor;
            var new_factor = app.factor * rel_factor;
            
            if( new_width  > $(window).width()  &&  // Don't shrink page below window size.
                new_height > $(window).height() &&
                new_factor < MAX_FACTOR ) {
                
                app.factor = new_factor;  // Update absolute zoom factor.
                app.dispatcher.trigger('zoom:objects', rel_factor);  // Zoom marks and zoom page.
                this.resizePage(new_width, new_height, $wall);
		        this.recenterWindow(rel_factor);
		        
		    }
		    
		},
		
		resizePage: function(new_width, new_height, $wall) {
		    
		    $wall.animate({
		        
		        width:  new_width,
		        height: new_height
		        
		    }, ANIM_OPTS);
		    
		},
        
        recenterWindow: function(rel_factor) {  // Page grows/shrinks from right and bottom
                                                // during zoom, so needs to be recentered.
            var $w = $(window);
            var half_width  = $w.width()  / 2;
            var half_height = $w.height() / 2;
            
            var old_x_center = $w.scrollLeft() + half_width;  // Page movement needs to be calibrated
            var new_x_center = rel_factor * old_x_center;     // from center, not top-left.
            
            var old_y_center = $w.scrollTop() + half_height;
            var new_y_center = rel_factor * old_y_center;
            
            $('html, body').animate({
                
                scrollLeft: new_x_center - half_width,
                scrollTop:  new_y_center - half_height
                
            }, ANIM_OPTS);
        },
		
	  ///////////////////////////////
	  // ***** MISCELLANEOUS ***** //
	  ///////////////////////////////
		
		clearRedos: function() {
		    
		    var coll  = app.Redos;
		    var model = coll.pop();
		    
            while (model) {
                model.destroy();
                model = coll.pop();
            }
		},
		
		resetDragging: function() {
		    
		    app.dragging = false;
		    
		    app.mousedown = false;
		    this.$('#wall').selectable('enable');
		},
		
		doNothing: function(e) { e.stopPropagation(); },
		
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
        
	});
	
}());