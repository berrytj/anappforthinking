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
        
		initialize: function() {
			                                             // Update view when model changes, e.g. after
			this.model.on('change', this.render, this);  // editing text, performing undo, or trashing.
			
			                                // Give the element a pointer to its view so you
			this.$el.data('view', this);    // can access it, e.g. after dragging or dropping).
			
			app.dispatcher.on('zoom:objects', this.zoom, this);
		},
		
		render: function() {
		    
		    var onPage = this.$el.parents().length;
		    
		    if (this.model.get('text')) {
		        
		        if (!onPage) this.putBackOnPage(this.$el);
		        
                this.$el.html(this.template(this.model.toJSON()))
			            .animate({
			                
			                left: this.model.get('x') * app.factor,
			                top:  this.model.get('y') * app.factor
			                
			             }, ANIM_OPTS);
			    
			    this.zoomSize();
			                           // Move this out of 'render' so it only gets called once?
			    this.makeDraggable();  // Doesn't work in 'initialize' (too early): causes additional
			                           // objects in a dragging group to jump. Use _.once?
			} else if (onPage) {
			                           // Detach element if it's on page without any
			    this.$el.detach();     // text, e.g. after deleting or redo-deleting.
			}
                                       // Return view so you can chain this function,
			return this;               // e.g. `append(view.render().el)`.
		},
		
		putBackOnPage: function($el) {
		    
		    $el.appendTo('#wall')
		       .removeClass('ui-draggable-dragging dragged dropped');
		                                                                 // Destroy draggable after re-appending
		    if ($el.hasClass('ui-draggable')) $el.draggable('destroy');  // or dragging won't work. (Object gets
		},                                                               // made draggable again below.)
		
		zoom: function(rel_factor) {
            
            this.zoomSize();
            
            var pos = this.$el.offset();
            
            this.$el.animate({
                
                left: pos.left * rel_factor,
                top:  pos.top  * rel_factor
                
            }, ANIM_OPTS);
		},
		
		updateLocation: function(solo) {
		    
		    this.createUndo();
		    
		    var loc = this.$el.offset();
		    
		    this.model.save({
		        
		        x: loc.left / app.factor,
		        y: loc.top  / app.factor
		        
		    }, {
		        // Element has already moved; pass silent to
		        // avoid micro-movements due to re-rendering:
		        silent: true,
		        success: function() {
		                    if (solo) app.dispatcher.trigger('saved');
		                 }
		    });
		    
		},
		
		cleanup: function(e) {
		    
		    e.stopPropagation();
		    
		    app.dispatcher.trigger('click:wall', e);
		    
		    // Free the element to be edited
		    // next time it gets clicked:
		    this.$el.removeClass('dragged');
		},
		
		createUndo: function() {
		    
		    app.dispatcher.trigger('clear:redos');
		    
		    // Quicker way to transfer multiple attributes?
		    // Have undo and mark both extend object model?
		    var current_state = {
                wall: WALL_URL,
                type: this.model.type,
			  obj_pk: this.model.get('id'),
			    text: this.model.get('text'),
			       x: this.model.get('x'),
			       y: this.model.get('y')
			};
			
			app.Undos.create(current_state);
		},
		
		clear: function(solo) {
		    
		    this.createUndo();
		    
		    this.model.save({
		        text: ''
		    }, {
		        success: function() {
		                    if (solo) app.dispatcher.trigger('saved');
		                 }
		    });
		    
		},
		
		setInitialDragPositions: function(ui) {
		    
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
		    
		},
		
		updateDragPositions: function(ui) {
		    
		    // Move all selected marks relative to their initial position:
            $('.ui-selected').each(function() {
                
                $(this).css({
                    left: $(this).data('x') + ui.position.left,
                    top:  $(this).data('y') + ui.position.top
                });
                
            });
		    
		},
		
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
                        
                        view.setInitialDragPositions(ui);
                        
                    } else {  // If dragging unselected mark:
                        
                        app.dispatcher.trigger('clear:selected');
                        
                    }
                    
                },
                
                drag: function(e, ui) {
                    
                    if ($(this).hasClass('ui-selected')) view.updateDragPositions(ui);
                    
                },
                
                stop: function() {
                    
                    if(app.cancelDrag === true) {
                        app.cancelDrag === false;
                    } else {
                        updateModels($(this), view.updateLocation);
                    }
                    
                }
                
			});
		},
		
		doNothing: function(e) { e.stopPropagation(); },
		
	});

}());