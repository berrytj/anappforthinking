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
			
			// Update view when model changes, e.g. after editing text.
			this.model.on('change',  this.render, this);
			this.model.on('destroy', this.remove, this);
			
			app.dispatcher.on('zoomObjects', this.zoom, this);
			
			this.$el.data('view', this);
		},
        
        initializeElement: function() {
            
            var view = this;
            
            this.$el.html( this.template( this.model.toJSON() ) )
			        .offset({
			            left: this.model.get('x') * app.factor,
			            top:  this.model.get('y') * app.factor
			         })
			        .draggable({
                        start: function(e, ui) {
                            
                            // To prevent input field from opening due to mousedown:
                            app.dragging = true;
                            
                            // To prevent mark from going into edit mode
                            // once the drag ends / mouse is lifted:
                            $(this).addClass('dragged');
                            
                            if($(this).hasClass('ui-selected')) {
                                
                                $('.ui-selected').each(function() {
                                    var pos = $(this).offset();
                                    $(this).data({
                                        'x': pos.left - ui.position.left,
                                        'y': pos.top  - ui.position.top
                                    });
                                });
                                
                            } else {
                                app.dispatcher.trigger('clearSelected');
                            }
                        },
                        drag: function(e, ui) {
                            if($(this).hasClass('ui-selected')) {
                                $('.ui-selected').each(function() {
                                    $(this).css({
                                        left: $(this).data('x') + ui.position.left,
                                        top:  $(this).data('y') + ui.position.top
                                    });
                                });
                            }
                        },
                        stop: function() {
                            if($(this).hasClass('ui-selected')) {
                                // 'group_end' comes first because undos are accessed LIFO:
                                app.dispatcher.trigger('undoMarker', 'group_end');
                                $('.ui-selected').each(function() {
                                    view.afterDragging( $(this) );
                                });
                                app.dispatcher.trigger('undoMarker', 'group_start');
                            } else {
                                view.afterDragging( $(this) );
                            }
                        },
			});
            
        },
        
		// Render the mark.
		render: function() {
		    
		    var onPage = this.$el.parents().length;
		    
		    if(this.model.get('text') === '') {
		        
		        if(onPage) this.$el.remove();
		        
		    } else {
		        
		        if(!onPage) $('#wall').append(this.el);
		        this.initializeElement();
			    this.zoomSize();
                
            }
            
            // Return view so you can chain this function,
            // e.g. so you can say 'append(view.render().el)'.
			return this;
		},
		
		afterDragging: function($obj) {
		    // Don't update location if object was dropped in
		    // the trash (and removed from the wall). If undone,
		    // object will show in its pre-trashed location.
		    if($obj.hasClass('dropped')) $obj.removeClass('dropped');
            else $obj.data('view').updateLocation();
		},
		
		zoom: function(new_width, new_height) {
            
            this.zoomSize();
            
            var pos = this.$el.offset();
            var new_x = new_width  * (pos.left / $('#wall').width());
            var new_y = new_height * (pos.top / $('#wall').height());
            this.$el.animate({ left: new_x, top: new_y }, ANIM_OPTS);
		},
		
		updateLocation: function() {
		    var loc = this.$el.offset();
		    this.createUndo();
		    this.model.save({
		        x: loc.left / app.factor,
		        y: loc.top  / app.factor
		    }, { silent: true });  // Silent because element has already been moved,
		                           // so it doesn't need to be re-rendered (which
		                           // causes micro-movements).
		},
		
		cleanup: function(e) {
		    e.stopPropagation();
		    app.dispatcher.trigger('wallClick', e);
		    // Free the element to be edited next time it gets clicked:
		    this.$el.removeClass('dragged');
		},
		
		createUndo: function() {
		    // Quicker way to transfer multiple attributes?
            app.Undos.create({ wall: WALL_URL,
                               type: this.model.type,
			                 obj_pk: this.model.get('id'),
			                   text: this.model.get('text'),
			                      x: this.model.get('x'),
			                      y: this.model.get('y') });
			
			app.dispatcher.trigger('clearRedos');
		},
		
		clear: function() {
		    this.createUndo();
		    this.model.save({ text: '' });
		},
		
		doNothing: function(e) { e.stopPropagation(); }
		
	});

}());