// Object View
// -------------

var app = app || {};

(function() {
    
    'use strict';
    
    // Object descendants include marks and waypoints.
	app.ObjectView = Backbone.View.extend({

		// The DOM events specific to an item.
		events: {
		             'mousedown': 'cleanup',
		             'mouseover': 'showX',
			'mousedown .destroy': 'clear',
		},

		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function(options) {
			
			// Update view when model changes, e.g. after editing text.
			this.model.on('change',  this.render, this);
			this.model.on('destroy', this.remove, this);
			
			this.dispatcher = options.dispatcher;
			this.dispatcher.on('zoomMarks', this.zoom, this);
			
			// Keep track of zoom factor:
			this.factor = options.factor;
		},
        
		// Render the mark.
		render: function() {
		    
		    var view = this;
			this.$el.html(this.template(this.model.toJSON()))
			        .offset({ left: this.model.get('x') * this.factor,
			                  top:  this.model.get('y') * this.factor })
			        .draggable({
			            start: function() {
			                $(this).addClass('dragged')
			                       .find('.destroy').css('opacity', 0);
			            },
			            stop: function() {
			                view.updateLocation();
			            }
			         });
			
			this.zoomSize();  // Need to call every time?
			return this;
		},
		
		zoom: function(factor, new_width, new_height) {
            
            this.factor = factor;
            
            var pos = this.$el.offset();
            var new_x = new_width  * (pos.left / $('#wall').width());
            var new_y = new_height * (pos.top / $('#wall').height());
            
            this.zoomSize();
            
            this.$el.animate({ left: new_x, top: new_y }, ANIM_OPTS);
		},
		
		showX: function(e) {
		    
		    if(!e.which) {  // If mouse is up (not dragging):
		        
		        var $x = this.$('.destroy');
		        $x.css('opacity', 1);
		        var $mark = this.$el;
		        $mark.on('mouseleave', function() {
		            $x.css('opacity', 0);
		            $mark.unbind('mouseleave');
		        });
		    
		    }
		},
		
		updateLocation: function() {
		    var loc = this.$el.offset();
		    this.createUndo();
		    this.model.save({ x: loc.left / this.factor,
		                      y: loc.top  / this.factor });
		},
		
		cleanup: function(e) {
		    e.stopPropagation();
		    
		    // FIX THIS: this closes editing when a mark is clicked,
		    // but even closes the mark you're currently editing / clicking.
//		    this.dispatcher.trigger('wallClick', e);
            
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
		},
		
		clear: function(e) {
		    e.stopImmediatePropagation();  // Or just normal stopProp?
//			undo, and don't actually destroy
			this.model.destroy();
		},
		
	});

}());