// Waypoint View
// -------------
// Waypoints are placed to make it easy to return
// to a certain spot on the wall.  If you click
// a waypoint's corresponding tag, the window will
// scroll to the waypoint. Zooming doesn't affect
// a waypoint's size, so they can always be easily read.

var app = app || {};
var WP_WIDTH = 140;
var WP_FONT_SIZE = 16;

(function() {
	
	'use strict';
	
	app.WaypointView = app.ObjectView.extend({
		
		className: 'waypoint',
		
		// Cache the template for a single waypoint.
		template: _.template( $('#waypoint-template').html() ),
		
		initialize: function() {

			app.ObjectView.prototype.initialize.call(this); // Call super.

			// Create corresponding tag and save it to a view variable.
			this.tag = this.createTag(this.model.get('text'));

			// Get the order of tags from the DB and sort them.
			app.dispatcher.trigger('update:tagsort');

		},
		
		render: function() {
			
			app.ObjectView.prototype.render.call(this); // Call super.
			
			var text = this.model.get('text');

			// Remove tag if waypoint is empty (i.e. deleted or un-created).
			// Otherwise append tag to tag group.
			if (text === '') {
				this.tag.$el.detach();
			} else {
				this.tag.text = text;
				this.tag.render().$el.appendTo($('#sortable-tags'));
			}

			// Update the tagsort to account for the newly-rendered waypoint.
			app.dispatcher.trigger('update:tagsort');
			
		},
		
		// Create a tag to be displayed on the bottom of the screen,
		// corresponding to this waypoint.
		createTag: function(text) {
				
			var view = new app.TagView({ waypoint: this, text: text });
			$('#sortable-tags').append(view.$el);
			return view.render();

		},
		
		// Toggle selection of waypoint if
		// appropriate key is held during click.
		respondToClick: function(e) {

			if (e.shiftKey || e.metaKey || e.ctrlKey) {

				var color = this.$el.hasClass('ui-selected') ? STROKE_COLOR : SELECTED_STROKE_COLOR;
				
				this.$el.toggleClass('ui-selected')
						.find('circle').css('stroke', color);
			}

		},

		// Waypoint starts out wide enough to handle lots of text, but
		// needs to be shrinkwrapped, once created, to remove the empty space
		// around it (that would be susceptible to dragging / selecting).
		shrinkwrap: function() {

			var $text = this.$el.children('.waypoint-text');
			$text.css('margin-left', (CIRCLE_WIDTH - $text.width()) / 2 + 'px');

		},

		zoomSize: function() {}, // Don't change waypoint size when zooming. Subject to change.
		
	});

}());