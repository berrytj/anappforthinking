// Waypoint View
// -------------

var app = app || {};
var WP_WIDTH = 140;
var WP_FONT_SIZE = 16;

(function() {
	
	'use strict';
	
	// Waypoint extends Object.
	app.WaypointView = app.ObjectView.extend({
		
		className: 'waypoint',
		
		// Cache the template function for a single waypoint.
		template: _.template( $('#waypoint-template').html() ),
		
		initialize: function() {

			app.ObjectView.prototype.initialize.call(this);  // Call super.
			this.tag = this.createTag(this.model.get('text'));
			app.dispatcher.trigger('update:tagsort');

		},
		
		render: function() {
			
			app.ObjectView.prototype.render.call(this);  // Call super.
			
			var text = this.model.get('text');

			if (text === '') {
				this.tag.$el.detach();
			} else {
				this.tag.text = text;
				this.tag.render().$el.appendTo($('#sortable-tags'));
			}

			app.dispatcher.trigger('update:tagsort');
			
		},
		
		// Create a tag to be displayed on the bottom of the screen,
		// corresponding to this waypoint.
		createTag: function(text) {
				
			var view = new app.TagView({ waypoint: this, text: text });
			$('#sortable-tags').append(view.$el);
			return view.render();

		},
		
		// Toggle selection of waypoint if certain keys are held during click.
		respondToClick: function(e) {

			if (e.shiftKey || e.metaKey || e.ctrlKey) {

				var color = this.$el.hasClass('ui-selected') ? STROKE_COLOR : SELECTED_STROKE_COLOR;
				
				this.$el.toggleClass('ui-selected').find('circle').css('stroke', color);

			}

		},

		// Waypoint starts out wide enough to handle lots of text,
		// but needs to be shrinkwrapped so the eventual empty space around it
		// doesn't result in dragging / selecting.
		shrinkwrap: function() {

			var $text = this.$el.children('.waypoint-text');
			$text.css('margin-left', (CIRCLE_WIDTH - $text.width()) / 2 + 'px');

		},

		zoomSize:   function() {},  // Don't change waypoint size when zooming. May change.
		
	});

}());