var app = app || {};
var ENTER_KEY = 13;

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}

$(function() {
    
    // Kick things off by creating the **App**.
	new app.AppView();
	
});

(function() {
    
    'use strict';
    
    
//    var dispatcher = _.extend({}, Backbone.Events);
    
    
    // The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#markapp',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'mousedown #wall':  'toggleInput',
			'mousedown #input': 'doNothing',
			'keypress #input':  'createMark'
		},

		// At initialization we bind to the relevant events on the `Marks`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting marks that might be saved in *localStorage*.
		initialize: function() {
			
			this.input = this.$('#input');
			this.dispatcher = _.extend({}, Backbone.Events);
			
			window.app.Marks.on('add', this.addOne, this);
			window.app.Marks.on('reset', this.addAll, this);
			
//			app.Marks.fetch({ data: { wall_id: wall_id } });
			app.Marks.fetch();  // Calls 'reset' on Marks collection.
			
		},

		// Add a single mark to the set by creating a view for it, and
		// appending its element to the 'wall'.
		addOne: function(mark) {
		    
		    var d = this.dispatcher;
			var view = new app.MarkView({ model:mark, dispatcher:d });
			$('#wall').append(view.el);
			view.render();
			
		},

		// Add all items in the **Marks** collection at once.
		addAll: function() {
			app.Marks.each(this.addOne, this);
		},
		
		toggleInput: function(e) {
		    
		    var $input = this.input;
		    
		    // If the unbound input field is open:
		    if($input.is(':visible')) {
		        
		        this.createMark(e);
		        
		        $input.hide();
		        
		    // If any mark-bound input fields are open:
		    } else if($('.input:visible').length) {  // Looking at subviews -- bad?
		        
		        this.dispatcher.trigger('wallClick', e);
		    
		    // If no input fields are open:
		    } else {
		        
		        $input.show();
		        
		        // Move to click location...
		        $input.offset({ left: e.pageX, top: e.pageY });
		        
		        // and focus once mouse is released.
		        $(window).mouseup(function() {
		            $input.focus();
		            $(window).unbind('mouseup');
		        });
		        
		    }
		    
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		createMark: function(e) {
		        
		        var notClicking = !e.pageX;
		        var notEnter = !(e.which == ENTER_KEY);
		        if(notClicking && notEnter) return;
		        
		        var $input = this.input;
			    var text = $input.val().trim();
			    
			    if(text) {
			        var loc = $input.offset();
			        app.Marks.create({ wall: wall_id,
			                           x: loc.left,
			                           y: loc.top,
			                           text: text });
			        
			        $input.val('');
			    }
			    
			    $input.hide();
		},
		
		doNothing: function(e) {
		    e.stopPropagation();
		}

	});
	
	
	// Mark View
	// --------------
	
	app.MarkView = Backbone.View.extend({
	// el is set to a 'div' by default
	    
	    LABEL_PADDING: 3,
	    
	    className: "mark",

		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),

		// The DOM events specific to an item.
		events: {
		    'mousedown':        'stopPropagation',
		    'click label':      'edit',
		    'keypress .input':  'finishEditing'
//			'mousedown label':      'edit',
//			'drag .mark':       'updateLocOnMouseup',
//			'mousedown .destroy':	'clear',
		},

		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function(options) {
			
			this.model.on('change', this.render, this);
			this.model.on('destroy', this.remove, this);
			this.model.on('visible', this.toggleVisible, this);
			
			// Stop editing mark if the wall is clicked.
			options.dispatcher.on('wallClick', this.finishEditing, this);
						
		},

		// Render the mark.
		render: function() {
			this.$el.html( this.template( this.model.toJSON() ) )
			        .offset({ left: this.model.get('x'), top: this.model.get('y') })
			        .draggable({
			            start: function(e, ui) {
			                $(this).addClass('dragged');
			            }
			         });
			
			
			var labelWidth = this.$('label').width();
			this.$('.labelBlock').width(labelWidth + this.LABEL_PADDING);
			
			return this;
		},
		
		stopPropagation: function(e) {
		    e.stopPropagation();
		},

		// Switch this view into 'editing' mode, displaying the input field.
		edit: function(e) {
		    
		    var $mark = this.$el;
		    
		    if($mark.hasClass('dragged')) {
		        $mark.removeClass('dragged');
		    } else {
		        this.$('.input').show()
		                        .focus()
		                        .val(this.model.get('text'));
		    }
		    
		},
		
		// Close the 'editing' mode, saving changes to the mark.
		finishEditing: function(e) {
		        
		        var $input = this.$('.input');
		        if($input.is(':visible')) {
		        
		            var notClicking = !e.pageX;
		            var notEnter = !(e.which == ENTER_KEY);
		            if(notClicking && notEnter) return;
		            
			        var text = $input.val().trim();
			        
			        if(text) {
			            this.model.save({ text:text });
			            $input.hide();
			        } else {
			            this.clear();
			        }
			    
			    }
			    
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function(e) {
		    
		    e.stopImmediatePropagation();
			this.model.destroy();
			
		}
	});
	
	
	// Mark Model
	// ----------

	// Our basic **Mark** model has one attribute: `text`.
	app.Mark = Backbone.Model.extend({
	    
		// Default attributes for the todo and ensure that each mark created
		// has 'text', 'x', and 'y' keys.
		defaults: {
			text: '',
			x: 0,
			y: 0
		}

	});
	
	
	// Mark Collection
	// ---------------
	
	var MarkSet = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: app.Mark,
		
		url: function() {
		    return '/api/v1/mark';
		}
		
	});
	
	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
	
}());