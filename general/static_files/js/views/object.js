// Object View
// -------------

var app = app || {};

(function() {
    
    'use strict';
    
    // Object descendants include marks and waypoints.
	app.ObjectView = Backbone.View.extend({
        
		// The DOM events specific to an item.
		events: {
		    'click .input' : 'doNothing',
		    'click'        : 'cleanup',
		},
        
		initialize: function() {
			
			this.model.on('change', this.render, this);  // Called after editing text, performing undo, trashing...
			this.$el.data('view', this);                 // Accessed after dragging, dropping...
			app.dispatcher.on('zoom:objects', this.zoom, this);
			this.makeDraggableOnce = _.once(this.makeDraggable);
		},
		
		render: function(noDraw) {
		    
		    var onPage = this.$el.parents().length;
		    
		    if (this.model.get('text')) {
		        
		        var options = _.clone(ANIMATE_UNDO);
		        
		        if (!onPage) {
		            this.putBackOnPage(this.$el);
		            options['duration'] = 0;  // Don't animate when first putting on page.
		        }
		        
			    if (noDraw !== 'noDraw') this.draw(options);
			    this.zoomSize();
			    this.makeDraggableOnce();
			    
			} else {
			    if (onPage) this.$el.detach();
			}
			
			return this;
		},
		
		draw: function(options) {
		    
		    this.$el.html(this.template( this.model.toJSON() ))
		            .animate({
			            left: this.model.get('x') * app.factor,
			            top:  this.model.get('y') * app.factor
			        }, options);
		},
		
		putBackOnPage: function($el) {
		    
		    $el.appendTo('#wall')
		       .removeClass('ui-draggable-dragging dragged dropped');
		    
		    if ($el.hasClass('ui-draggable')) $el.draggable('destroy');
		    
		    this.makeDraggableOnce = _.once(this.makeDraggable);
		},
		
		zoom: function(rel_factor) {
            
            this.zoomSize();
            
            var pos = this.$el.offset();
            
            this.$el.animate({
                
                left: pos.left * rel_factor,
                top:  pos.top  * rel_factor
                
            }, ANIM_OPTS);
            
		},
		
		updateLocation: function() {
		    
		    this.createUndo();
		    this.saveLocation();
		    
		},
		
		saveLocation: function() {
		    
		    var loc = this.$el.offset();
		    
		    this.model.save({
		        
		        x: loc.left / app.factor,
		        y: loc.top  / app.factor
		        
		    }, { silent: true });  // Element has already moved
		    
		},
		
		cleanup: function(e) {
		    
		    e.stopPropagation();
		    
		    this.respondToClick(e);
		    this.$el.removeClass('dragged');  // Free the element to be edited next time it gets clicked.
		    
		    app.dispatcher.trigger('click:wall', e);
		    
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
		
		clear: function() {
		    
		    this.createUndo();
		    this.model.save({ text: "" });
		},
		
		setInitialDragPositions: function(ui) {
		    
		    // If dragging selected mark, save initial location
            // of all selected marks as basis for relative position
            // adjustments during dragging.
            
            $('.ui-selected').each(function() {
                
                var pos = $(this).offset();
                
                $(this).data({
                    "x": pos.left - ui.position.left,
                    "y": pos.top  - ui.position.top
                });
                
            });
		},
		
		updateDragPositions: function(ui) {
		    
            $('.ui-selected').each(function() {  // Move all selected marks relative to their initial position.
                
                $(this).css({
                    left: $(this).data('x') + ui.position.left,
                    top:  $(this).data('y') + ui.position.top
                });
                
            });
		},
		
		makeDraggable: function() {
		    
		    var that = this;
		    
		    this.$el.draggable({
		        
                start: function(e, ui) {
                    
                    app.dragging = true;          // To prevent input field from opening due to click.
                    $(this).addClass('dragged');  // To prevent mark from going into edit mode once the drag ends / mouse is lifted.
                    
                    if ($(this).hasClass('ui-selected')) {
                        that.setInitialDragPositions(ui);
                    } else {
                        app.dispatcher.trigger('clear:selected');
                    }
                },
                
                drag: function(e, ui) {
                    if ($(this).hasClass('ui-selected')) that.updateDragPositions(ui);
                },
                
                stop: function() {
                    
                    if (app.cancelDrag === true) {
                        app.cancelDrag = false;
                    } else {
                        updateModels($(this), that.updateLocation);
                    }
                    
                }
                
			});
		},
		
		doNothing: function(e) { e.stopPropagation(); },
		
	});

}());