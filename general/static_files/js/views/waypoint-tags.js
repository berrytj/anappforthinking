// Waypoint Tags View
// ------------------

var app = app || {};
var HIDE_TIME = 250;
var ARROW_PADDING = 26;
var ORIG_WP_Y_FACTOR = 0.4;
var WP_Y_FACTOR = 0.35;

(function() {
	
	'use strict';
	
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

		getSortOrder: function() {

			var that = this;

			$.get('/sortTags/', { wall_id: wall_id }, function(order) {
				
				if (order) that.sortTags(order);
				that.makeSortable();
				that.$el.show();
				that.TAGS_LEFT = that.$el.offset().left - $(document).scrollLeft();
				
			});

		},

		sortTags: function(order) {

			var array = JSON.parse(order);
			var that = this;

			_.each(array, function(id) {
				that.$('#'+id).appendTo( that.$('#sortable-tags') );
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
				addToQueue(wall_id, order, this, this.postSortOrder);

			}

		},

		postSortOrder: function(wall_id, order) {

			return $.post('/sortTags/', { wall_id: wall_id, order: order });

		},
		
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
		
		cleanup: function(e) {

			e.stopPropagation();
			app.dispatcher.trigger('close:inputs', e);

		},
				
	});

}());