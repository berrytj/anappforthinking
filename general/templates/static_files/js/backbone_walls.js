var app = app || {};
var ENTER_KEY = 13;

$(function() {
    // Kick things off by creating the **App**.
	new app.AppView();
});

(function() {
    
    'use strict';    
    
    // The Application
	// ---------------

	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#markapp',

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'click #wall': 'createMark',
		},

		// At initialization we bind to the relevant events on the `Marks`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting marks that might be saved in *localStorage*.
		initialize: function() {
			window.app.Marks.on( 'add', this.addOne, this );
			window.app.Marks.on( 'reset', this.addAll, this );

			app.Marks.fetch();
		},

		// Add a single mark to the set by creating a view for it, and
		// appending its element to the 'wall'.
		addOne: function( mark ) {
			var view = new app.MarkView({ model: mark });
			$('#wall').append( view.render().el );
		},

		// Add all items in the **Marks** collection at once.
		addAll: function() {
			this.$('#wall').html('');
			app.Marks.each(this.addOne, this);
		},

		// Generate the attributes for a new Mark.
		newAttributes: function(e) {
			return {
				x: e.pageX;
				y: e.pageY;
			};
		},

		// If you hit return in the main input field, create new **Mark** model,
		// persisting it to *localStorage*.
		createMark: function(e) {
			app.Marks.create( this.newAttributes(e) );
		},

	});
	
    
    // Convert to toolbar view.
    // The Toolbar
	// ---------------
/*
	// Our overall **AppView** is the top-level piece of UI.
	app.AppView = Backbone.View.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#todoapp',

		// Our template for the line of statistics at the bottom of the app.
		statsTemplate: _.template( $('#stats-template').html() ),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			'keypress #new-todo': 'createOnEnter',
			'click #clear-completed': 'clearCompleted',
			'click #toggle-all': 'toggleAllComplete'
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function() {
			this.input = this.$('#new-todo');
			this.allCheckbox = this.$('#toggle-all')[0];
			this.$footer = this.$('#footer');
			this.$main = this.$('#main');

			window.app.Todos.on( 'add', this.addOne, this );
			window.app.Todos.on( 'reset', this.addAll, this );
			window.app.Todos.on('change:completed', this.filterOne, this);
			window.app.Todos.on("filter", this.filterAll, this);

			window.app.Todos.on( 'all', this.render, this );

			app.Todos.fetch();
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
			var completed = app.Todos.completed().length;
			var remaining = app.Todos.remaining().length;

			if ( app.Todos.length ) {
				this.$main.show();
				this.$footer.show();

				this.$footer.html(this.statsTemplate({
					completed: completed,
					remaining: remaining
				}));

				this.$('#filters li a')
					.removeClass('selected')
					.filter('[href="#/' + ( app.TodoFilter || '' ) + '"]')
					.addClass('selected');
			} else {
				this.$main.hide();
				this.$footer.hide();
			}

			this.allCheckbox.checked = !remaining;
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function( todo ) {
			var view = new app.TodoView({ model: todo });
			$('#todo-list').append( view.render().el );
		},

		// Add all items in the **Todos** collection at once.
		addAll: function() {
			this.$('#todo-list').html('');
			app.Todos.each(this.addOne, this);
		},

		filterOne : function (todo) {
			todo.trigger("visible");
		},

		filterAll : function () {
			app.Todos.each(this.filterOne, this);
		},

		// Generate the attributes for a new Todo item.
		newAttributes: function() {
			return {
				title: this.input.val().trim(),
				order: app.Todos.nextOrder(),
				completed: false
			};
		},

		// If you hit return in the main input field, create new **Todo** model,
		// persisting it to *localStorage*.
		createOnEnter: function( e ) {
			if ( e.which !== ENTER_KEY || !this.input.val().trim() ) {
				return;
			}

			app.Todos.create( this.newAttributes() );
			this.input.val('');
		},

		// Clear all completed todo items, destroying their models.
		clearCompleted: function() {
			_.each( window.app.Todos.completed(), function( todo ) {
				todo.destroy();
			});

			return false;
		},

		toggleAllComplete: function() {
			var completed = this.allCheckbox.checked;

			app.Todos.each(function( todo ) {
				todo.save({
					'completed': completed
				});
			});
		}
	});*/
    // End ToolbarView
    
    
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
	
	
	// Mark View
	// --------------

	// The DOM element for a mark...
	app.MarkView = Backbone.View.extend({

		//...is a div.
		divName:  'div',

		// Cache the template function for a single mark.
		template: _.template( $('#mark-template').html() ),

		// The DOM events specific to an item.
		events: {
			'click .mark':      'edit',
//			'drag .mark':       'updateLocOnMouseup',
			'click .destroy':	'clear',
			'keypress .edit':	'closeOnEnter',
			'blur .edit':		'close'
		},

		// The MarkView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Mark** and a **MarkView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function() {
			this.model.on( 'change', this.render, this );
			this.model.on( 'destroy', this.remove, this );
			this.model.on( 'visible', this.toggleVisible, this );
		},

		// Re-render the text of the mark.
		render: function() {
			this.$el.html( this.template( this.model.toJSON() ) );

			this.input = this.$('.edit');
			return this;
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function() {
			this.$el.addClass('editing');
			this.input.focus();
		},

		// Close the `"editing"` mode, saving changes to the mark.
		close: function() {
			var value = this.input.val().trim();

			if ( value ) {
				this.model.save({ text: value });
			} else {
				this.clear();
			}

			this.$el.removeClass('editing');
		},

		// If you hit `enter`, we're through editing the item.
		closeOnEnter: function( e ) {
			if ( e.which === ENTER_KEY ) {
				this.close();
			}
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function() {
			this.model.destroy();
		}
	});
	
	
	// Mark Collection
	// ---------------

	// The collection of marks is backed by *localStorage* instead of a remote
	// server.
	var MarkSet = Backbone.Collection.extend({

		// Reference to this collection's model.
		model: app.Mark,

		// Save all of the marks under the `"marks"` namespace.
		localStorage: new Store('marks-backbone'),

	});

	// Create our global collection of **Marks**.
	app.Marks = new MarkSet();
	
}());