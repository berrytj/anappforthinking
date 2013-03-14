// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 250;
var ARROW_PADDING = 26;
var ORIG_WP_Y_FACTOR = 0.4;
var WP_Y_FACTOR = 0.35;
var TAGS_LEFT = $('#waypoint-tags').offset().left;

(function() {
	
	'use strict';
	
	app.WaypointTagsView = Backbone.View.extend({
		
		el: '#waypoint-tags',
		
		events: {
			'click'               : 'doNothing', // switch doNothing to cleanup?
			'click #add-waypoint' : 'showInput',
			'click #hide-tags'    : 'hideTags',
		},

		initialize: function() {

			var that = this;
			setTimeout(function() {
				that.sortTags();
			}, 1000); // Make this more specific.

			app.dispatcher.on('update:tagsort', this.updateSort, this);
		},

		sortFromArray: function(a, b, array) {

			var pos_a = array.indexOf(a.id);
			var pos_b = array.indexOf(b.id);

		    if (pos_a < pos_b) return -1;
		    if (pos_a > pos_b) return 1;
		    
		    return 0;
		},

		sortTags: function() {

			var that = this;

			$.get('/sortTags/', { wall_id: wall_id }, function(order) {
				
				if (order) {

					var $tags = that.$('#sortable-tags');
					var array = JSON.parse(order);

					$tags.html($tags.children().get().sort(function(a, b) {
						return that.sortFromArray(a, b, array);
					}));

				}

				that.makeSortable();
				
			});

		},

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

		updateSort: function() {

			var $tags = this.$('#sortable-tags');

			if ($tags.hasClass('ui-sortable')) {

				var array = $tags.sortable('toArray');
				var order = JSON.stringify(array);
				addToQueue(wall_id, order, this, this.postSortUpdate);

			}

		},

		postSortUpdate: function(wall_id, order) {
			return $.post('/sortTags/', { wall_id: wall_id, order: order });
		},
		
		hideTags: function(e) {
			
			var button = this.$('#hide-tags');
			
			var x, arrow;
			
			if (button.html() === '«') {

				x = -1 * ( button.offset().left - $(document).scrollLeft() - ARROW_PADDING );
				arrow = '»';

			} else {
				
				x = TAGS_LEFT;
				arrow = '«';

			}
			
			this.$el.animate({
				
				left: x,
				
			}, HIDE_TIME, function() { button.html(arrow); });
			
		},
		
		showInput: function(e) {
			
			var $input = $('#wp-input');
			
			var relative_x = ( $(window).width()  - $input.width() ) / 2;
			var relative_y = ( $(window).height() - $input.outerHeight() ) * ORIG_WP_Y_FACTOR;
			
			var left = relative_x + $(document).scrollLeft();
			var top  = relative_y + $(document).scrollTop();
			
			$input.show().offset({ left: left, top: top });
			$input.children('textarea').first().focus();

		},
		
		doNothing: function(e) { e.stopPropagation(); },
				
	});

}());