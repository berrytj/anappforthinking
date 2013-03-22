// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 250;
var ARROW_PADDING = 26;
var ORIG_WP_Y_FACTOR = 0.4;
var WP_Y_FACTOR = 0.35;

(function() {
	
	'use strict';
	
	// Each waypoint has a tag that corresponds to it.
	// Clicking on the tag automatically scrolls the user
	// to the corresponding waypoint.
	app.WaypointTagsView = Backbone.View.extend({
		
		el: '#waypoint-tags',
		
		events: {
			'click #add-waypoint' : 'showInput',
			'click #hide-tags'    : 'hideTags',
			'click'               : 'cleanup',
		},

		initialize: function() {

			app.dispatcher.on('sort:tags',      this.getSortOrder, this);
			app.dispatcher.on('update:tagsort', this.updateSort,   this);

		},

		// Order of waypoint tags is stored in DB.
		// Get it upon load, sort tags, then show them.
		getSortOrder: function() {

			var that = this;

			$.get('/sortTags/', { wall_id: wall_id }, function(order) {
				
				if (order) that.sortTags(order);
				that.makeSortable();
				that.$el.show();
				that.TAGS_LEFT = that.$el.offset().left - $(document).scrollLeft();
				
			});

		},

		// Tag sort is stored as a stringified array of ids.
		// Parse and move tags into place accordingly.
		sortTags: function(order) {

			var array = JSON.parse(order);
			var that = this;

			_.each(array, function(id) {
				that.$('#'+id).appendTo( that.$('#sortable-tags') );
			});

		},

		// Once tags have been sorted, use jQuery UI to make
		// the collection sortable.
		makeSortable: function() {

			var that = this;

			this.$('#sortable-tags').sortable({

				axis: 'x',
				items: '.waypoint-tag',
				scroll: false,
				tolerance: 'pointer',
				zIndex: 10000,
				update: function(ev, ui) {
					that.updateSort();
				},

			});

		},

		// Let the server know when the user rearranges the tagsort.
		updateSort: function() {

			var $tags = this.$('#sortable-tags');

			if ($tags.hasClass('ui-sortable')) {

				var array = $tags.sortable('toArray');
				var order = JSON.stringify(array);
				addToQueue(wall_id, order, this, this.postSortOrder);

			}

		},

		// Send the actual tagsort update to the server (callback from addToQueue).
		postSortOrder: function(wall_id, order) {

			return $.post('/sortTags/', { wall_id: wall_id, order: order });

		},
		
		// Clicking the #hide-tags button allows the user to push the
		// tags offscreen for more viewing room.  Button arrow automatically
		// changes direction in the process.
		hideTags: function(e) {
			
			var button = this.$('#hide-tags');
			
			var x, arrow;
			
			if (button.html() === '«') {

				x = -1 * ( button.offset().left - $(document).scrollLeft() - ARROW_PADDING );
				arrow = '»';

			} else {
				
				x = this.TAGS_LEFT;
				arrow = '«';

			}
			
			this.$el.animate({
				
				left: x,
				
			}, HIDE_TIME, function() { button.html(arrow); });
			
		},
		
		// When the #add-waypoint button is clicked, show an input
		// that allows a user to enter text and create a waypoint.
		// Input shows up near the middle of the screen.
		showInput: function(e) {

			this.cleanup(e);  // Need to make sure this happens first so 'close:inputs' event
							  // doesn't close this input.

			var $input = $('#wp-input');

			var relative_x = ( $(window).width()  - $input.width() ) / 2;
			var relative_y = ( $(window).height() - $input.outerHeight() ) * ORIG_WP_Y_FACTOR;
			
			var left = relative_x + $(document).scrollLeft();
			var top  = relative_y + $(document).scrollTop();
			
			$input.show().offset({ left: left, top: top });
			$input.children('textarea').first().focus();

		},
		
		// When a waypoint is clicked, resolve anything
		// that might be going on elsewhere on the page.
		cleanup: function(e) {

			e.stopPropagation();
			app.dispatcher.trigger('close:inputs', e);

		},
				
	});

}());