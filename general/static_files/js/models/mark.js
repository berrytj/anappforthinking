// Mark Model
// ----------

var app = app || {};

(function() {
    
    'use strict';

	// Our basic **Mark** model has one attribute: `text`.
	app.Mark = window.TastypieModel.extend({
	    
		// Default attributes for the todo and ensure that each mark created
		// has 'text', 'x', and 'y' keys.
		defaults: {
			text: '',
			x: 0,
			y: 0
		}

	});

}());