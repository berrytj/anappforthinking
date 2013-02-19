// Object View
// -------------

var app = app || {};

(function() {
    
    'use strict';
    
    // Object descendants include marks and waypoints.
	app.ObjectView = Backbone.View.extend({

		// The DOM events specific to an item.
		events: {
		    'mousedown .input': 'doNothing',
		    'mousedown': 'cleanup',
		},
        
		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function() {
			
			// Update view when model changes, e.g. after editing
			// text, performing undo, or trashing:
			this.model.on('change',  this.render, this);
			
			app.dispatcher.on('zoomObjects', this.zoom, this);
			
			// Give the element a pointer to its view so you
			// can access it e.g. after dragging or dropping):
			this.$el.data('view', this);
		},
		
		// Render the mark.
		render: function() {
		    
		    var onPage = this.$el.parents().length;
		    
		    if (this.model.get('text')) {
		        
		        if (!onPage) {
		            this.$el.appendTo('#wall')
		                    .removeClass('ui-draggable-dragging dragged dropped');
		            
		            // Destroy draggable after re-appending or dragging won't
		            // work (object gets made draggable again below):
		            if (this.$el.hasClass('ui-draggable')) this.$el.draggable('destroy');
		        }
		        
                this.$el.html(this.template(this.model.toJSON()))
			            .offset({
			                left: this.model.get('x') * app.factor,
			                top:  this.model.get('y') * app.factor
			            });
			    
			    this.zoomSize();
			    
			    // Move this out of 'render' so it only gets called once?
			    // Doesn't work in 'initialize' (too early): causes additional
			    // objects in a dragging group to jump.
			    this.makeDraggable();
			    
			} else if(onPage) {
			    // Detach element if it's on page without any text, e.g.
			    // after deleting or redo-deleting.
			    this.$el.detach();
			}
            
            // Return view so you can chain this function,
            // e.g. `append(view.render().el)`.
			return this;
		},
		
		afterDragging: function($obj) {
		    // Don't update location if object was dropped in
		    // the trash (and removed from the wall). If undone,
		    // object will show in its pre-trashed location.
		    if ($obj.hasClass('dropped')) return $obj.removeClass('dropped');
		    else                          return $obj.data('view').updateLocation();
		},
		
		zoom: function(new_width, new_height) {
            
            this.zoomSize();
            
            var pos = this.$el.offset();
            var new_x = new_width  * (pos.left / $('#wall').width());
            var new_y = new_height * (pos.top / $('#wall').height());
            this.$el.animate({ left: new_x, top: new_y }, ANIM_OPTS);
		},
		
		updateLocation: function() {
		    
		    var x = this.model.get('x');
		    var y = this.model.get('y');
		    
		    var loc = this.$el.offset();
		    
		    this.model.save({
		        x: loc.left / app.factor,
		        y: loc.top  / app.factor
		    }, {
		        // Element has already moved; pass silent to
		        // avoid micro-movements due to re-rendering:
		        silent: true
		    });
		    
		    return this.createUndo(null, x, y);
		},
		
		cleanup: function(e) {
		    e.stopPropagation();
		    app.dispatcher.trigger('wallClick', e);
		    // Free the element to be edited next time it gets clicked:
		    this.$el.removeClass('dragged');
		},
		
		createUndo: function(text, x, y) {
		    
		    app.dispatcher.trigger('clearRedos');
		    
		    // Quicker way to transfer multiple attributes?
		    // Have undo and mark both extend object model?
		    var current_state = {
                wall: WALL_URL,
                type: this.model.type,
			  obj_pk: this.model.get('id'),
			    text: text || this.model.get('text'),
			       x: x    || this.model.get('x'),
			       y: y    || this.model.get('y')
			};
			
			var undo = new app.Undo(current_state);
			
			var saved = undo.save();
			
			$.when(saved).then(function() {
			    app.Undos.add(undo);
			    return saved;
			});
		},
		
		clear: function() {
		    this.createUndo(this.model.get('text'));
		    this.model.save({ text: '' });
		    // Note: we don't have to worry about `save` finishing before
		    // `undo`, because we've already passed `undo` the affected value.
		},
		
		doNothing: function(e) { e.stopPropagation(); },
		
		makeDraggable: function() {
		    
		    var view = this; 
		    this.$el.draggable({
                        start: function(e, ui) {
                            // To prevent input field from opening due to mousedown:
                            app.dragging = true;
                            
                            // To prevent mark from going into edit mode
                            // once the drag ends / mouse is lifted:
                            $(this).addClass('dragged');
                            
                            if ($(this).hasClass('ui-selected')) {
                                
                                // If dragging selected mark, save initial location
                                // of all selected marks as basis for relative position
                                // adjustments during dragging:
                                $('.ui-selected').each(function() {
                                    var pos = $(this).offset();
                                    $(this).data({
                                        'x': pos.left - ui.position.left,
                                        'y': pos.top  - ui.position.top
                                    });
                                });
                                
                            } else {
                                // If dragging unselected mark, clear selected:
                                app.dispatcher.trigger('clearSelected');
                            }
                        },
                        drag: function(e, ui) {
                            if ($(this).hasClass('ui-selected')) {
                                // Move all selected marks relative to their initial position:
                                $('.ui-selected').each(function() {
                                    $(this).css({
                                        left: $(this).data('x') + ui.position.left,
                                        top:  $(this).data('y') + ui.position.top
                                    });
                                });
                            }
                        },
                        stop: function() {
                            // generalize into function you can use here and after trash dropping...
                            
  //                          updateModels($(this), view.afterDragging);
//                        var updateModels = function (obj, func) {
                            if ( $(this).hasClass('ui-selected') ) {  // If a group was being dragged:
                                
                                var addingMarker = $.Deferred();
                                
                                // Two drags in quick succession leads to a glitch where 'group_end' is
                                // added twice without a 'group_start' in between. Disable dragging while
                                // undo is processing?
                                console.log('starting group');
                                app.dispatcher.trigger('undoMarker', 'group_end', addingMarker);  // 'group_end' comes before 'group_start'
                                                                                                  // because undos will be accessed LIFO.
                                var addingUndos = [];
                                
                                // Undos must wait until the 'group_end' marker has been placed;
                                // hence they wait for resolution of the `addingMarker` deferred object:
                                addingMarker.done(function() {
                                    
                                    // Undos are added asynchronously to save time...
                                    $('.ui-selected').each(function() {
                                        addingUndos.push( view.afterDragging( $(this) ) );
                                    });
                                    
                                    // ...but all must be added before placing the 'group_start' marker:
                                    $.when.apply(null, addingUndos).done(function() {
                                        console.log('ending group');
                                        app.dispatcher.trigger('undoMarker', 'group_start');
                                    });
                                    
                                });
                                
                            } else {  // If just one object was being dragged:
                                view.afterDragging( $(this) );
                            }
                        }
			});
		},
		
	});

}());