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
var MAX_FACTOR = 12;

var INPUT_OFFSET_X = 10;
var INPUT_OFFSET_Y = 4;
var SPACING = 2;

var SELECTABLE_DISTANCE = 10;

var WAIT_FOR_PASTE = 100;
var LIST_PAUSE = 1500;
var LIST_ANIMATE = 150;
var WAIT_FOR_DRAG = 130;
var INPUT_FADE = 0;
var LOADING_FADE = 350;
var TIME = 0;  // Go slower if you can make font size animation less choppy.
var ANIM_OPTS = { duration: TIME, queue: false };  // Animation options.
var ANIMATE_UNDO = { duration: 100, queue: false };  // Animation options.
var EXTRA = 1.2;
															 // Get items for this wall only.  Don't 
var FETCH_OPTS = { data: { wall__id: wall_id, limit: 0 } };  // limit quantity returned (default is 20).

var WP_PADDING = 6;
var CIRCLE_WIDTH = 84;
var STROKE_COLOR = '#BBBBBB';
var SELECTED_STROKE_COLOR = 'rgba(222,170,29,1)';

(function() {
	
	'use strict';
	
	app.AppView = Backbone.View.extend({
		
		el: 'body',
		
		// Delegated events. Switch from mousedown to click for showing input?
		events: {
			'click'            : 'toggleInput',
			'keydown'          : 'toggleOrZoom',
			'mouseup'          : 'resetDragging', //move into toggle input? //is this still being used?
			'click #input'     : 'doNothing',
			'click #trash-can' : 'doNothing',
		},
		
		
	  //////////////////////////////
	  // ***** INITIALIZING ***** //
	  //////////////////////////////
		
		
		initialize: function() {

			this.setViewVariables();
			this.setAppVariables();
			this.listen();
			this.populateObjects();
			this.populateUndos();
			this.makeSelectable();
			
			new app.ToolbarView();
			new app.WaypointTagsView();
			
		},
		
		setViewVariables: function() {
			
			this.input = this.$('#input');  // Cache input field (accessed frequently).
			this.input.autosize();          // Input box will grow / shrink automatically.
			this.keyDown = false;           // Used to prevent multiple zooms when holding down an arrow key.
			
		},
		
		setAppVariables: function() {
			
			app.factor = 1;        // Keep track of zoom factor.
			app.dragging = false;  // To distinguish between click and drags.
			app.disconnected = false;
			app.queue = $.Deferred();
			app.queue.resolve();
			
		},
		
		populateObjects: function() {
			
			var doneLoading = _.after(2, this.doneLoading, this);

			app.Marks.fetch( _.extend(FETCH_OPTS, { success: doneLoading }) );

			app.Waypoints.fetch( _.extend(FETCH_OPTS, { success: function() {

				doneLoading();
				app.dispatcher.trigger('sort:tags');

			} }) );
			
		},
		
		populateUndos: function() {
			
			var callback = function(coll) {
				if (!coll.length) app.dispatcher.trigger('stack:empty', coll.name);
			};
			
			var options = _.extend(FETCH_OPTS, { success: callback });
			
			app.Undos.fetch(options);
			app.Redos.fetch(options);
			
		},
		
		doneLoading: function() {
			this.$('#loading').fadeOut(LOADING_FADE);
		},
		
		listen: function() {
			
			this.listenToCollection(app.Marks);
			this.listenToCollection(app.Waypoints);
			
			this.listenToUndoKeys();
			this.listenForCopyPaste();
			
			var d = app.dispatcher = _.extend({}, Backbone.Events);  // Use extend to clone other objects?
			
			d.on('zoom',           this.zoom,             this);
			d.on('undo',           this.undo,             this);
			d.on('list',           this.list,             this);
			d.on('paste',          this.pasteFromColl,    this);
			d.on('clear:redos',    this.clearRedos,       this);
			d.on('clear:selected', this.clearSelected,    this);
			d.on('undoMarker',     this.undoMarker,       this);
			d.on('close:inputs',   this.hideInputs,       this);
		},
		
		listenToCollection: function(coll) {
			
			var that = this;

			coll.on('add', function(model) {
				if (!model.get('silent')) that.createViewForModel(model);
			});
			
			coll.on('reset', this.renderCollection, this);
		},

		createViewForModel: function(model) {

			var Constructor = (model.type === 'mark') ? app.MarkView : app.WaypointView;
			var view = new Constructor({ model: model });
			return view.render();

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

		
		undoMarker: function(type) {
			
			app.Undos.create({
				wall: WALL_URL,
				type: type     // 'group_end' or 'group_start'
			});
		},

		toggleOrZoom: function(e) {
			
			if (e.which === ENTER_KEY) {
				this.toggleInput(e);
			} else if (e.which === UP_KEY || e.which === DOWN_KEY) {
				this.prepareZoom(e);
			}

		},
		
		listenForKeyup: function() {
			
			var view = this;
			$(window).keyup(function() {
				
				view.keyDown = false;
				$(window).unbind('keyup');
				
			});
		},

		hideInputs: function(e) {
			return this.closeInput('mark') || this.closeInput('waypoint');
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

		createModel: function(coll, text, pos) {

			var attributes = {
				wall: WALL_URL,
				text: text,
				x: Math.round(pos.left / app.factor),
				y: Math.round(pos.top  / app.factor)
			};

			coll.create(attributes, { success: this.createEmptyUndo });
		},

		closeInput: function(type) {
			
			var container, textarea, coll;

			if (type === 'mark') {

				container = this.input;
				textarea = container;
				coll = app.Marks;

			} else if (type === 'waypoint') {
				
				container = this.$('#wp-input');
				textarea = container.children('textarea').first();
				coll = app.Waypoints;

			}

			if (container.is(':visible')) {

				var text = textarea.val().trim();
				if (text) this.createModel(coll, text, container.offset());
				container.fadeOut(INPUT_FADE, function() { textarea.val('') }); // need to blur?
				return true;

			}
			
		},
		
		toggleInput: function(e) {
			
			if (app.dragging) return;

			var open = this.hideInputs(e);
			
			if (!open) {  // If neither input is open:
				
				if ($('.input:visible').length) {  // If any mark is being edited:

					// This triggers hideInputs() again -- probably not
					// a performance concern, but I may replace with a 
					// new event that triggers closure of just mark-bound inputs.
					app.dispatcher.trigger('close:inputs', e);

				} else if ($('.ui-selected').length) {  // If any marks are selected:

					if (e.shiftKey || e.metaKey || e.ctrlKey) return;
					app.dispatcher.trigger('clear:selected');

				} else {
					
					this.showInput(e);

				}
				
			}
		},
		
		clearSelected: function() {
			
			this.$('.ui-selected').each(function() {

				$(this).removeClass('ui-selected');
				$(this).find('circle').css('stroke', STROKE_COLOR);

			});
			
		},
		
		showInput: function(e) {
			
			var left, top;

			if (e.pageX) {  // clicked
				
				left = e.pageX - INPUT_OFFSET_X;
				top  = e.pageY - INPUT_OFFSET_Y;

			} else {  // pressed enter

				var obj = app.last_edited;
				left = obj.model.get('x');
				top = obj.model.get('y') + obj.$el.outerHeight() + SPACING / app.factor;
				e.preventDefault();  // Don't return inside of new input field.

			}

			this.input.css('font-size', app.factor * ORIG_FONT_SIZE)
					  .width(app.factor * MARK_WIDTH)
					  .height(app.factor * MARK_HEIGHT)
					  .show()
					  .offset({ left: left, top: top });

			this.input.focus();
		},

		makeSelectable: function() {

			var that = this;

			this.$('#wall').selectable({
		
				filter: '.mark, .waypoint:not(#wp-input)',

				distance: SELECTABLE_DISTANCE,
				
				start: function(e) {  // Modified jquery-ui source to add-to-selection when holding shift.
									  // (Add-to-selection is default behavior when holding cmd / ctrl.)

					app.dragging = true;  // To prevent input field from opening due to mousedown.
					app.dispatcher.trigger('close:inputs', e);
					
					// ***Update to avoid triggering this when shift-selecting***:
					app.dispatcher.trigger('enable:list', false);

					that.scrollWhileSelecting();

					if (e.shiftKey) that.$('.ui-selected').addClass('preselected');
				},
				
				selecting: function(e, ui) {
					
					var $obj = $(ui.selecting);

					if ($obj.hasClass('preselected')) {

						$obj.removeClass('ui-selecting');
						$obj.find('circle').css('stroke', STROKE_COLOR);

					} else {

						$obj.find('circle').css('stroke', SELECTED_STROKE_COLOR);

					}

				},
				
				unselecting: function(e, ui) {
					$(ui.unselecting).find('circle').css('stroke', STROKE_COLOR);
				},
				
				stop: function() {

					$(window).unbind('mousemove');
					$('.preselected').removeClass('preselected');
					if ($('.ui-selected').length) app.dispatcher.trigger('enable:list', true);

				},
				
			});

		},
		
		scrollWhileSelecting: function() {

			$(window).mousemove(function(e) {

				var sens = 10, speed = 20, $d = $(document);

				if (e.pageY - $d.scrollTop() < sens) {

					$d.scrollTop($d.scrollTop() - speed);

				} else if ($(window).height() - (e.pageY - $d.scrollTop()) < sens) {

					$d.scrollTop($d.scrollTop() + speed);

				}

				if (e.pageX - $d.scrollLeft() < sens) {

					$d.scrollLeft($d.scrollLeft() - speed);

				} else if ($(window).width() - (e.pageX - $d.scrollLeft()) < sens) {

					$d.scrollLeft($d.scrollLeft() + speed);
					
				}

			});

		},

		
	  ////////////////////////////////
	  // ***** COPY / PASTING ***** //
	  ////////////////////////////////
		
		
		cut: function() {
			
			this.undoMarker('group_end');
			this.copy('cut');
			this.undoMarker('group_start');
			
		},
		
		copy: function(cut) {
			
			var $selected = this.$('.ui-selected');
			
			if ($selected.length) {
				
				app.dispatcher.trigger('enable:paste');
				
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
				
				var noText = that.convertTextToMarks();
				if (noText && app.Clipboard.length) that.pasteFromColl();
				
			}, WAIT_FOR_PASTE); // Listen for paste event instead? Different across browsers.
			
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
			
			var that = this;
			$.when(saving).done(function() {
				that.spacePastedMarks(marks);
			});
		},
		
		spacePastedMarks: function(marks) {
			
			this.evenlySpace(marks);
			
			var animating = this.promiseFromArray(marks);
			
			animating.done(function() {
				
				_.each(marks, function($mark) {
					$mark.data('view').saveLocation();
				});
				
			});
		},
		
		promiseFromArray: function(marks) {
			
			var $marks = $();
			
			for (var i = 0; i < marks.length; i++) {
				$marks = $marks.add(marks[i]);
			}
			
			return $marks.promise();
		},
		
		pasteFromText: function(text, saving) {
			
			var lines = _.without(text.split('\n'), '');
			var last = lines.length - 1;
			var saving_last = null;
			var that = this;
			var x = $(document).scrollLeft() + ($(window).width() - MARK_WIDTH) / 2;
			var y = $(document).scrollTop() + $(window).height() * PASTE_Y_FACTOR;
			var marks = [];
			
			this.undoMarker('group_end');
			
			_.each(lines, function(line, i) {
				
				if (i === last) saving_last = saving;
				var model = that.pasteLineFromText(line, x, y, saving_last);
				var view  = that.createViewForModel(model);
				marks.push(view.$el);
				
			});
			
			return marks;
		},
		
		pasteLineFromText: function(line, x, y, waiting) {
			
			var attrs = {
				wall: WALL_URL,
				text: line,
				x: x,
				y: y,
				silent: true,
			};
			
			var that = this;
			var model = app.Marks.create(attrs, { success: function(model) {
				
				that.createEmptyUndo(model);
				
				if (waiting) {
					waiting.resolve();
					that.undoMarker('group_start');
				}
				
			}});
			
			return model;
		},
		
		pasteFromColl: function() {
			
			this.undoMarker('group_end');
			var that = this;
			var last = app.Clipboard.length - 1;
			app.Clipboard.each(function(model, i) {
				that.pasteMarkFromColl(model, i, last);
			});
			
		},
		
		pasteMarkFromColl: function(model, i, last) {
			
			var clone = this.clone(model);
			
			// Waypoints don't paste in right place, fix
			clone.set({
				x: clone.get('x') + $(document).scrollLeft(),
				y: clone.get('y') + $(document).scrollTop()
			});
			
			var that = this;
			this.getColl(clone.type).create(clone, { success: function(model) {
				
				that.createEmptyUndo(model);
				if (i === last) that.undoMarker('group_start'); // Need to do invocation to preserve i?
				
			}});
		},
		
		// Clones a model without replicating the id.
		clone: function(model) {
			
			var attrs = _.clone(model.attributes);
			attrs.id = null;

			return new model.constructor(attrs);
		},
		
		
		
	  /////////////////////////
	  // ***** LISTING ***** //
	  /////////////////////////
		
		
		list: function() {
			
			var $marks = this.$('.ui-selected').not('.waypoint');
			
			if ($marks.length) {
				
				var ordered_marks = this.sortMarksByTop($marks);
				this.leftAlignMarks($marks, ordered_marks[0]);
				this.evenlySpace(ordered_marks);
				
				var $obj = $marks.first();
				$marks.promise().done(function() {  // `.promise()` waits for all animations to finish.
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

		leftAlignMarks: function($marks, $first) {
			
			var x = $first.offset().left;
			
			$marks.each(function() {
				
				$(this).animate({
					left: x
				}, {
					duration: LIST_ANIMATE,
					queue:    false
				});
				
			});
			
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
		
		
		// NOTE: Terminology here assumes an undo is being performed. If a redo
		// is being performed, undo means redo and redo means undo (as you can
		// see from the assignments below).  I decided to leave it undo-specific
		// because using ambiguous names made the functions much less clear/readable.
		
		undo: function(isRedo) {
			
			var Undos = app.Undos, Redos = app.Redos;

			if (isRedo) Undos = app.Redos, Redos = app.Undos;

			var undo = Undos.pop();
			
			if (undo) {
				this.prepareUndo(undo, Undos, Redos);
			} else {
				$('#error-sound').get()[0].play();
			}

		},
		
		prepareUndo: function(undo, Undos, Redos) {
			
			var type = undo.get('type');
			
			if (type === 'group_start') {

				undo.destroy();
				Redos.create({ wall: WALL_URL, type: 'group_end' });
				this.performUndo(Undos.pop(), Undos, Redos, true);
				
			} else if (type === 'group_end') {
				console.log('broken');  // Throw an exception instead?
			} else {
				this.performUndo(undo, Undos, Redos);
			}
			
		},
		
		performUndo: function(undo, Undos, Redos, group) {

				if (undo.get('type') === 'group_end') console.log('broken');
				
				var coll = this.getColl(undo.get('type'));
				var obj = coll.get(undo.get('obj_pk'));
				
				Redos.create( this.currentState(obj) );
				obj.save( this.formerState(undo) );
				undo.destroy();
				
				if (group) this.recurseUndo(Undos, Redos);
		},
		
		recurseUndo: function(Undos, Redos) {
			
			var undo = Undos.pop();
			
			if (undo.get('type') === 'group_end') {
				
				undo.destroy();
				Redos.create({
					wall: WALL_URL,
					type: 'group_start',
				});
				
			} else {
				this.performUndo(undo, Undos, Redos, true);
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
		
		
		
	  /////////////////////////
	  // ***** ZOOMING ***** //
	  /////////////////////////
		
		prepareZoom: function(e) {

			if (this.$('.input:visible').length) return; // Let arrow keys move around input when editing.
			e.preventDefault();   						 // Prevent arrow keys from panning the window up and down.
			if (this.keyDown) return;  					 // Prevent multiple zooms when holding down arrow keys.

			this.keyDown = true;
			this.listenForKeyup();
			this.zoom(e.which === UP_KEY ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR);

		},

		zoom: function(rel_factor) {
			
			var $wall = $('#wall');
			
			var new_width  = $wall.width()  * rel_factor;
			var new_height = $wall.height() * rel_factor;
			var new_factor = app.factor * rel_factor;
			
			if ( new_width  > $(window).width()  &&  // Don't shrink page below window size.
			     new_height > $(window).height() &&
			     new_factor < MAX_FACTOR ) {
				
				app.factor = new_factor;  							 // Update absolute zoom factor.
				app.dispatcher.trigger('zoom:objects', rel_factor);  // Zoom marks and zoom page.
				this.resizePage(new_width, new_height, $wall);
				this.recenterWindow(rel_factor);
				
			} else {
				$('#error-sound').get()[0].play();
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