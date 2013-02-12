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
        
		// Render the mark.
		render: function() {
		    
		    if(this.model.get('text') === '') {
		        this.$el.html('');
		    } else {
		    
		        var view = this;
			    this.$el.html(this.template(this.model.toJSON()))
			            .offset({ left: this.model.get('x') * app.factor,
			                      top:  this.model.get('y') * app.factor })
			            .draggable({
			                start: function() {
			                    $(this).addClass('dragged');
			                },
			                stop: function() {
			                    if($(this).hasClass('dropped')) $(this).removeClass('dropped');
			                    else view.updateLocation();
			                }
			    });
			    
			    this.zoomSize();
            
            }
			return this;
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
		    this.model.save({ x: loc.left / app.factor,
		                      y: loc.top  / app.factor });
		},
		
		cleanup: function(e) {
		    e.stopPropagation();
		    
		    // FIX THIS: this closes editing when a mark is clicked,
		    // but even closes the mark you're currently editing / clicking.
		    app.dispatcher.trigger('wallClick', e);
            
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