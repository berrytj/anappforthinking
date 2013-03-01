// The Application
// ---------------
// There may be some lingering code from an example that
// I was learning from: addyosmani.github.com/todomvc/

var app = app || {};

var PASTE_Y_FACTOR = 0.33;

var ENTER_KEY = 13;
var UP_KEY = 38;
var DOWN_KEY = 40;
var Z_KEY = 90;
var X_KEY = 88;
var C_KEY = 67;
var V_KEY = 86;

var WALL_URL = API_NAME + "/wall/" + wall_id + "/";

var ZOOM_OUT_FACTOR = 0.8;
var ZOOM_IN_FACTOR = 1 / ZOOM_OUT_FACTOR;
var MAX_FACTOR = 160;

var INPUT_OFFSET_X = 7;
var INPUT_OFFSET_Y = 4;
var SPACING = 6;

var WAIT_FOR_PASTE = 100;
var LIST_PAUSE = 1500;
var LIST_ANIMATE = 150;
var WAIT_FOR_DRAG = 130;
var TIME = 150;  // Go slower if you can make font size animation less choppy.
var ANIM_OPTS = { duration: TIME, queue: false };  // Animation options.
var EXTRA = 1.2;
                                                             // Get items for this wall only.  Don't 
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };  // limit quantity returned (default is 20).


(function() {
    
    'use strict';
    
	app.AppView = Backbone.View.extend({
	    
		el: 'body',
        
		// Delegated events. Switch from mousedown to click for showing input?
		events: {
		    'click'               : 'waitThenToggle',
			'click #input'        : 'doNothing',
			'click #trash-can'    : 'doNothing',
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
		    
		    app.Marks.fetch(FETCH_OPTS);
			app.Waypoints.fetch(FETCH_OPTS);
			
			var callback = function(coll) {
		        if (!coll.length) app.dispatcher.trigger('stack:empty', coll.name);
			};
			
			var options = _.extend(FETCH_OPTS, { success: callback });
			
			app.Undos.fetch(options);
			app.Redos.fetch(options);
		    
		},
		
		listen: function() {
		    
		    this.listenToCollection(app.Marks);
			this.listenToCollection(app.Waypoints);
			
			this.listenToUndoKeys();
			this.listenForCopyPaste();
		    
		    var d = app.dispatcher = _.extend({}, Backbone.Events);  // Use extend to clone other objects?
		    
		    d.on('zoom',           this.zoom,          this);
			d.on('undo',           this.undo,          this);
			d.on('list',           this.list,          this);
			d.on('paste',          this.pasteFromColl, this);
			d.on('clear:redos',    this.clearRedos,    this);
			d.on('clear:selected', this.clearSelected, this);
			d.on('undoMarker',     this.undoMarker,    this);
			d.on('click:wall',     this.hideInputs,    this);
		},
		
		listenToCollection: function(coll) {
		    
		    coll.on('add',   this.createViewForModel, this);
		    coll.on('reset', this.renderCollection,   this);
		    
		},
		
		createViewForModel: function(model) {
			
			if (model.get('text')) {
			    
			    var Constructor = (model.type === 'mark') ? app.MarkView : app.WaypointView;
			    var view = new Constructor({ model: model });
			    view.render();
			    return view;
			    
			}
		},
		
		renderCollection: function(coll) {
		    coll.each(this.createViewForModel, this);
		},
		
		listenToUndoKeys: function() {
		    
		    $(document).keydown(function(e) {
		        
		        if (e.which === Z_KEY && e.metaKey) {
		            var ev = e.shiftKey ? 'try:redo' : 'try:undo';
		            app.dispatcher.trigger(ev);
		        }
			    
	        });
	        
		},
		
		listenForCopyPaste: function() {
		    
		    var view = this;
		    $(document).keydown(function(e) {
		        
		        if (e.metaKey) {
		            if      (e.which === X_KEY) view.cut();
		            else if (e.which === C_KEY) view.copy();
		            else if (e.which === V_KEY) view.paste(e);
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
		                              // Noted so that you can disable selector if
//		    app.mousedown = true;     // input appears while mouse is still down.
		    
		    var view = this;
		    // Showing the input and dragging both stem from the mousedown event;
		    // here we're waiting to see if the user drags before showing the input.
		    // May be removed if we decide to use the click event instead of mousedown.
//		    setTimeout(function() {
		        if (!app.dragging) view.toggleInput(e);
//		    }, WAIT_FOR_DRAG);
		},
		
		toggleInput: function(e) {
		    
		    var open = this.hideInputs(e);
		    
		    if (!open) {  // If neither input is open:
		        
		        if ($('.input:visible').length) {  // If any mark is being edited:
		            app.dispatcher.trigger('click:wall', e);  
		        } else if ($('.ui-selected').length) {  // If any marks are selected:
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
		
		cut: function() {
		    
            this.undoMarker('group_end');
		    this.copy('cut');
		    this.undoMarker('group_start');
		    
		},
		
		copy: function(cut) {
		    
		    var $selected = this.$('.ui-selected');
		    
		    if ($selected.length) {
		        
		        app.Clipboard.reset();
		        
		        var that = this;
		        $selected.each(function() {
		            that.copyObject($(this).data('view'), cut);
		        });
		        
		    }
		    
		},
		
		copyObject: function(view, cut) {
		    
		    var clone = this.clone(view.model);
		    
		    if (cut) view.clear();
		    
		    clone.set({
		        x: clone.get('x') - $(document).scrollLeft(),
		        y: clone.get('y') - $(document).scrollTop()
		    });
		    
		    app.Clipboard.add(clone);
		},
		
		paste: function() {
		    
		    // If input field is open, copy/paste normally.
		    if ($('.input:visible').length) return;
		    
		    this.catchPaste();
		    
		    var that = this;
		    setTimeout(function() {
		        
//		        this.undoMarker('group_end');
		        var noText = that.convertTextToMarks();
		        if (noText) that.pasteFromColl();
		        
		    }, WAIT_FOR_PASTE);
		    
		},
		
		catchPaste: function() {
		    
		    this.input.css('opacity', 0)
		              .show()
		              .offset({ left: $(document).scrollLeft(),
		                        top:  $(document).scrollTop()  })
		              .focus();
		    
		},
		
		convertTextToMarks: function() {
		    
		    var text = this.input.val();
		    
		    if (!text) return true;
		    
		    this.input.css('opacity', 1).val('').hide();
		    
		    var saving = $.Deferred();
		    
		    var marks = this.pasteFromText(text, saving);
		    this.evenlySpace(marks);
		    this.saveAfterPasting(marks, saving);
		    
		},
		
		saveAfterPasting: function(marks, saving) {
		    
		    var animating = this.getPromise(marks);
		    
		    $.when(animating, saving).done(function() {
		        
		        _.each(marks, function($mark) {
		            $mark.data('view').saveLocation();
		        });
		        
		    });
		    
		},
		
		getPromise: function(marks) {
		    
		    var $marks = $();
		    
		    for (var i = 0; i < marks.length; i++) {
		        $marks = $marks.add(marks[i]);
		    }
		    
		    return $marks.promise();
		},
		
		pasteFromText: function(text, saving) {
		    
		    var lines = text.split('\n');
		    var last = lines.length - 1;
		    var saving_last = null;
		    var view;
		    var that = this;
		    var x = $(document).scrollLeft() + ($(window).width() - ORIG_INPUT_WIDTH) / 2;
		    var y = $(document).scrollTop() + $(window).height() * PASTE_Y_FACTOR;
		    var marks = [];
		    
		    _.each(lines, function(line, i) {
		        
		        if (i === last) saving_last = saving;
		        view = that.pasteLineFromText(line, i, x, y, saving_last);
		        marks.push(view.$el);
		        
		    });
		    
		    return marks;
		    
		},
		
		pasteLineFromText: function(line, i, x, y, waiting) {
		    
		    var attrs = {
			    wall: WALL_URL,
			    text: line,
			    x: x,
			    y: y,
			};
		    
		    var model = app.Marks.create(attrs, {
		                    success: function(model) {
		                                if (waiting) waiting.resolve();
//		                                that.createEmptyUndo(model);
//		                                placeMarker('group_start');
		                             },
		                    silent: true,
		    });
		    
		    return this.createViewForModel(model);
		    
		},
		
		pasteFromColl: function() {
		    
		    var placeMarker = _.after(app.Clipboard.length, this.undoMarker);
		    
		    var that = this;
		    app.Clipboard.each(function(model) {
		        that.pasteMarkFromColl(model, placeMarker);
		    });
		    
		},
		
		pasteMarkFromColl: function(model, placeMarker) {
		    
		    var clone = this.clone(model);
		    
		    // Waypoints don't paste in right place, fix
		    clone.set({
		        x: clone.get('x') + $(document).scrollLeft(),
		        y: clone.get('y') + $(document).scrollTop()
		    });
		    
		    var that = this;
		    this.getColl(clone.type).create(clone, {
		        success: function(model) {
		                    that.createEmptyUndo(model);
		                    placeMarker('group_start');
		                 }
		    });
		    
		},
		
		// Clones a model without replicating the id.
		clone: function(model) {
		    
		    var attrs = _.clone(model.attributes);
		    attrs.id = null;
		    
		    var Const = model.constructor;
		    var clone = new Const(attrs);
		    
		    return clone;
		    
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
			    $input.val('').hide();
			    
			}
		},
		
		getModelAttributes: function(text, pos) {
		    
			return {
			    wall: WALL_URL,
			    text: text,
			    x:    pos.left / app.factor,
			    y:    pos.top  / app.factor
			};
		    
		},
		
		createModel: function($input, text) {
		    
			var coll = ($input == this.input) ? app.Marks : app.Waypoints;
			var attributes = this.getModelAttributes( text, $input.offset() );
			
			coll.create(attributes, { success: this.createEmptyUndo });
			
		},
		
		createEmptyUndo: function(model) {
			                              // Create a blank undo so object
			app.Undos.create({            // creation can be undone / redone.
			    
			    wall:   WALL_URL,
                type:   model.type,
			    obj_pk: model.get('id'),
			    text:   "",
			    x:      0,
			    y:      0
			    
			});
			
			app.dispatcher.trigger('clear:redos');
		},
		
		undoMarker: function(type) {
		    
            app.Undos.create({
                
                wall: WALL_URL,
                type: type     // 'group_end' or 'group_start'
                
            }, {
                success: function() {
                            var status = (type === 'group_end') ? 'saving' : 'saved';
                            app.dispatcher.trigger(status);
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
		    
		    if ($marks.length) {
		        
		        this.leftAlignMarks($marks);
		        var ordered_marks = this.sortMarksByTop($marks);
		        this.evenlySpace(ordered_marks);
		        
		        var $obj = $marks.first();
		        
		        // `.promise()` waits for all animations to finish.
		        $marks.promise().done(function() {
		            updateModels($obj, $obj.data('view').updateLocation, $marks);
		        });
		        
		    }
		},
		
		sortMarksByTop: function($marks) {
		    
		    var marks = $marks.get();
		    
		    // Using insertion sort because array should be mostly sorted:
		    // marks higher on the screen are likely to have been created earlier.
		    for (var i = 1; i < marks.length; i++) {
		        var j = i;
		        while (j > 0) {  // Loop through all previous items in the array:
		            var current = marks[j];
		            var prev    = marks[j-1];
		            var y = $(current).offset().top;
		            if (y < $(prev).offset().top) {
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
		    
		    for (var k = 0; k < marks.length; k++) {
		        marks[k] = $(marks[k]);
		    }
		    
		    return marks;
		},
		
		evenlySpace: function(marks) {
		    
		    var $prev = marks[0];
		    var new_y = $prev.offset().top;
		    var $mark;
		    
		    for (var i = 1; i < marks.length; i++) {
		        // Add previous object y-value, previous object height,
		        // and spacing to get next object y-value.
		        new_y += $prev.outerHeight() + SPACING * app.factor;
                $mark = marks[i];
		        
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
		        
		    } else {
		        app.dispatcher.trigger('saved');
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
		
		performUndo: function(undo, Undos, Redos, group) {
		        
		        var coll = this.getColl( undo.get('type') );
		        var obj  = coll.get( undo.get('obj_pk') );
                
                Redos.create( this.currentState(obj) );
                obj.save( this.formerState(undo) );
                undo.destroy({
                    success: function() {
                                if (!group) app.dispatcher.trigger('saved');
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
		                app.dispatcher.trigger('saved');
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
		
		getColl: function(type) {
		    
		    if (type === 'mark') {
		        return app.Marks;
		    } else if (type === 'waypoint') {
		        return app.Waypoints;
		    }
		    
		},
		
		clearRedos: function() {
		    app.Redos.reset();
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