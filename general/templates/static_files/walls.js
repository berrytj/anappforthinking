var DEFAULT_INPUT_WIDTH = 450, DEFAULT_INPUT_HEIGHT = 70, DEFAULT_MARK_WIDTH = 450;
var mouseUp = 1;
var MARK_PADDING = 3;
var selectees = 0;
var inputOpen = false;
var inputWasOpen = false;
var dragging = false;
var $editing = null;
var $input = $("#input"), $wInput = $("#w-input");
var zoom_factor = 0.85;
var x = 0;
var mouseupCount = 0;
var NOT_FADED_COLOR = $("#undo-button").css("color");
var FADED_COLOR = "#AAAAAA";

function moveMarkToFront($mark) {
	var index_highest = 0;
   	$(".mark").each(function() {
   		var index_current = parseInt($(this).css("zIndex"), 10);  // 10 indicates a decimal number
   		if(index_current > index_highest) index_highest = index_current;
   	});
   	$mark.css("zIndex", index_highest + 1);
}

function getPK($obj) {
	var nums = $obj.attr("id").match(/\d+/);
	return parseInt(nums[0], 10);
}

function updateObjLocation(pk, type, x, y) {
	$.post( "/" + wall_id + "/moveObj/",
			{ pk:pk, type:type, x:x, y:y },
			function() { $("#redo-button").css("color", FADED_COLOR); } );
}

function createObj(text, x, y, type) {
	$.post( "/" + wall_id + "/newObj/",
			{ text:text, type:type, x:x, y:y },
			function(pk) {
				$("#redo-button").css("color", FADED_COLOR);
				if(type === "mark") {
					$input.val("").hide();
					drawMark(text, x, y, pk);
					initMark($("#mark" + pk));
				} else if(type === "waypoint") {
					$wInput.val("").hide();
					drawWaypoint(text, x, y, pk);
					initWaypoint($("#waypoint" + pk));
				}
			} );
}

function drawMark(text, x, y, pk) {
	var markHtml =	'<div id="mark'+pk+'" class="mark" style="left:'+x+'px; top:'+y+'px;">'+
						'<div class="bullet">&there4;&nbsp;</div>'+
						'<div class="cont">'+
							'<span id="sizer'+pk+'" class="sizer">'+text+'</span>'+
						'</div>'+
					'</div>';
	$("#wrapper").append(markHtml);
}

function drawWaypoint(text, x, y, pk) {
	$("#wrapper").append( $("<div>").text(text).attr("id","waypoint"+pk) );
	$wp = $("#waypoint"+pk);
	$wp.offset({ "left":x, "top":y }).addClass("waypoint");
}

function closeInput($field, type) {
    if($field.is(":visible")) {
	    var text = $field.val();
	    if($editing) {
		    updateMarkText(text);
	    } else if(text.length) {
		    var pos = $field.offset();
		    createObj(text, Math.floor(pos.left), Math.floor(pos.top), type);
	    }
	    $field.hide();
	    inputOpen = false;
	}
}

function updateMarkText(text) {
	if(text.length) {
		var $wasEditing = $editing;
		$editing = null;
		$.post( "/" + wall_id + "/editObj/",
				{ pk:getPK($wasEditing), text:text },
				function() {
					$("#redo-button").css("color", FADED_COLOR);
					$wasEditing.show().find(".sizer").text(text);
					$wasEditing.width(DEFAULT_MARK_WIDTH);
					resizeMark($wasEditing);
					$input.val("").hide();
				} );
	} else {
		deleteObj($editing, "mark");  // delete object if user removes all text
		$editing = null;
	}
}

function resizeMark($mark) {
	var $sizer = $("#sizer" + getPK($mark));
	$mark.width($sizer.width() + 25);  // add 3px to avoid causing another wrap
}

function initMark($mark) { // use pk instead of whole mark for these functions?
	resizeMark($mark);
	makeDraggable($mark, "mark");
	attachX($mark, "mark");
	$mark.mousedown(function(e) { mousedownEvents(e, $mark); });
	$mark.mouseup(function(e) { mouseupEvents(e, $mark); });
	$mark.hover(function() { if(!dragging) $(this).children(".x").css("opacity", 1); },
		 		function() { if(!dragging) $(this).children(".x").css("opacity", 0); });
}

function createWaypointTag($wp, pk) {
    var tagHtml = '<span id="waypoint'+ pk +'tag" class="wp-tag">'+ $wp.text() +'</span>';
	$("#waypoint-tags").prepend(tagHtml);
	var $tag = $("#waypoint"+pk+"tag");
	$tag.mousedown(function(e) { mousedownEvents(e, $tag); });
	$tag.mouseup(function(e) { mouseupEvents(e, $tag); });
}

function initWaypoint($wp) {
	if($wp.attr("id") !== "w-input") {
		makeDraggable($wp, "waypoint");
//		attachX($wp, "waypoint");
		$wp.mousedown(function(e) { mousedownEvents(e, $wp); });
		$wp.mouseup(function(e) { mouseupEvents(e, $wp); });
		var pk = getPK($wp);
		if(!$("#waypoint"+pk+"tag").length) createWaypointTag($wp, pk);
	}
}

function initInputs() {
	$input.keypress(function(e) {
		if(e.which === 13) {
			closeInput($input, "mark");
			return false;
		}
	});
	$wInput.keypress(function(e) {
		if(e.which === 13) {
			closeInput($wInput, "waypoint");
			return false;
		}
	});
}

function deleteObj($obj, type) {
	$.post( "/" + wall_id + "/eraseObj/",
			{ pk:getPK($obj), type:type },
			function() { $obj.remove(); }
	);
}

function attachX($obj, type) {
	$obj.append( $("<div>").text("x").addClass("x")
						   .mousedown(function(e) { mousedownEvents(e, $(this)); })
						   .mouseup(function(e) { mouseupEvents(e, $(this)); }) );
}

function pageClk(e) {
//	selectees = $(".ui-selected").length + $(".ui-selecting").length;
}

function makeDraggable($obj, type) {
	$obj.draggable({
   		start:function(e, ui) {
   			if(type === "mark") moveMarkToFront($obj);
   			dragging = true;
   		},
   		stop:function(e, ui) {
   			var x = Math.floor(ui.position.left);
   			var y = Math.floor(ui.position.top);
   			updateObjLocation(getPK($obj), type, x, y);
   			$obj.removeClass("elevated");
   		}
	});
}

function allowSelecting() {
	$("#wrapper").selectable({
			"distance":10,  // different than tolerance?
			"filter":".mark",
			"cancel":".mark, .menu-item, #input",  // don't start selecting from these objects
			"start":function(e, ui) {
				dragging = true;
				alert("start selecting");
			 },
			"selecting":function(e, ui) {
				dragging = true;
				alert("selecting selecting");
			 }
	});
}

function clickMark(e, $obj) {
	if(e.shiftKey) {
		$obj.toggleClass("ui-selected");
	} else {
		var $mark = $obj.closest(".mark");
		$editing = $mark;
		var pos = $mark.offset();
		$input.show().offset({ "left":pos.left, "top":pos.top }).focus();
		$input.val($mark.find(".sizer").text()).height($mark.height() + 20);
		$mark.hide();
		inputOpen = true;
	}
}

function mousedownEvents(e, $obj) {
	mouseupCount = 0;
	if(!e.shiftKey) $(".ui-selected").removeClass("ui-selected");
	if(inputOpen) {
		inputWasOpen = true;
		var id = $obj.attr("id");
		if(id !== "input" && id !== "w-input") {
			closeInput($input, "mark");
			closeInput($wInput, "waypoint");
		} else {
			e.stopPropagation();
		}
	}
}

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}

function hideTags($obj) { //doesn't show on first click
	if($obj.html() === "«") {
		var left = -1*($obj.offset().left - $(document).scrollLeft()) + 15;
		$('#waypoint-tags').animate({ left:left }, 500, function() {
			$("#hide-waypoint-tags").html("»");
		});
	} else {
		$('#waypoint-tags').animate({ left:0 }, 500, function() {
			$("#hide-waypoint-tags").html("«");
		});
	}
}

function showWInput() {
	var left = 0.5*($(window).width() - $wInput.width()) + $(document).scrollLeft();
	var top = 0.4*($(window).height() - 100) + $(document).scrollTop(); //100 is height with padding
	$wInput.show().offset({ "left":left, "top":top }).focus();
}

function moveToWaypoint($obj) {
	var pos = $("#waypoint" + getPK($obj)).offset();
	var left = pos.left - 0.5*$(window).width() + 0.5*$wInput.width();
	var top = pos.top - 0.4*$(window).height() + 0.5*100;
	$("html, body").animate({ scrollLeft:left, scrollTop:top }, 1000);
}

function clickOptions(e, $obj) {
	x = 1;
	var id = $obj.attr("id");
	switch(true) {
		case $obj.hasClass("x"):
			deleteObj($obj.closest(".mark"), "mark"); break; //update for waypoints
		case $obj.hasClass("sizer"):
		case $obj.hasClass("cont"):
		case $obj.hasClass("mark"):
			if(!inputWasOpen) clickMark(e, $obj); break;
		case id === "add-waypoint":
			showWInput();
			inputOpen = true;
			break;
		case $obj.hasClass("wp-tag"):
			moveToWaypoint($obj); break;
		case id === "zoom-out":
			zoom(zoom_factor); break;
		case id === "zoom-in":
			zoom(1/zoom_factor); break;
		case id === "undo-button":
			performUndo("undo", "redo"); break;
		case id === "redo-button":
			performUndo("redo", "undo"); break;
		case id === "hide-waypoint-tags":
			hideTags($obj); break;
		case $obj.hasClass("waypoint"):
		case id === "main-menu-link" || id === "main-menu-button":
		case id === "wall-title" || id === "menu":
			break;
		case !inputWasOpen && !selectees: //page click
			$input.show().offset({ "left":e.pageX, "top":e.pageY }).focus();
			inputOpen = true;
	}
}

function mouseupEvents(e, $obj) {
	if(mouseupCount === 0 && !dragging) clickOptions(e, $obj);
	inputWasOpen = false;
	dragging = false;
	if(!e.shiftKey) selectees = 0;  // also udpate if things were selected
	mouseupCount++;
}

$(function() {
	
	$("#input").autoGrow();
	
	if($(".waypoint").length <= 1) {
		createObj("home",
				  Math.floor(0.5*($(window).width() - $wInput.width()) + $(document).scrollLeft()),
				  Math.floor(0.3*($(window).height() - 100) + $(document).scrollTop()),
				  "waypoint");
	}
	
	$("*").mousedown(function(e) {
		mousedownEvents(e, $(this));
	});
	
	$("*").mouseup(function(e) { //do selectees
		mouseupEvents(e, $(this));
	});
	
	initInputs();
	undoKeys();
//	allowSelecting();
	$(".mark").each(function() { initMark($(this)); });
	$(".waypoint").each(function() { initWaypoint($(this)); });
	
});

window.onload = function() {
//	scrollToMiddle();
}

function performUndo(clicked, notClicked) {
	$.post("/" + wall_id + "/" + clicked + "/", {}, function(data) {
			if(data.pk !== -1) { //is this right or does javascript need to convert data.pk to int? check with fresh wall
				$("#" + notClicked + "-button").css("color", NOT_FADED_COLOR);
				if(parseInt(data.remaining) <= 1) $("#" + clicked + "-button").css("color", FADED_COLOR);
   			 	var text=data.text, x=data.x, y=data.y, type=data.type, pk=data.pk;
   			 	if(type=="mark") {
   			 	    $("#mark" + pk).remove();
   			 	    if(text.length) {  // "deleted" marks have empty string
   			 		    drawMark(text, x, y, pk);
					    initMark($("#mark" + pk));
				    }
				} else if(type=="waypoint") {
				    $("#waypoint" + pk).remove();
   			 	    if(text.length) {  // "deleted" marks have empty string
   			 		    drawWaypoint(text, x, y, pk);
					    initWaypoint($("#waypoint" + pk));
				    } else {
				        $("#waypoint"+pk+"tag").remove();
				    }
				}
			}
   	});
}

function zoom(factor) { //try using *=
	$(".mark").each(function() {  //also get rid of cutoffs (bottom of words, top of x's): use borders to see what's happening
		var pos = $(this).offset(); //size of x's doesn't change yet
		$(this).offset({ "left": Math.floor(factor*pos.left),
						 "top" : Math.floor(factor*pos.top)	 });
		var size = factor*parseInt($(this).css("font-size"));
		if(size < 12) {
			$(this).css({ "font-family":"HelveticaNeue"}); //eventually don't have this check every mark inside of each
		} else {
			$(this).css({ "font-family":"HelveticaNeue-Light"}); //also change font when it gets super small
		}
		$(this).css({ "font-size":size,
					  "line-height":factor*parseInt($(this).css("line-height"))+"px" });
		$(this).width(1.02*factor*$(this).width()); // a precise number here to keep width shrinking with text shrinkage
													// but not cause wrapping? is it because padding/there4 aren't being shrunk
													// along with text? not working when zooming back in, btw.
//		also animate window loc based on factor (everything goes up and to the left):
//		$("html, body").animate({ scrollTop:factor*$(document).scrollTop, scrollLeft:factor*$(document).scrollLeft }, 0);
	});
}

function scrollToMiddle() {
	var top = ($("body").height() - window.innerHeight) / 2;
	var left = ($("body").width() - window.innerWidth) / 2;
	$("html, body").animate({ scrollTop:top, scrollLeft:left }, 0);
}

function undoKeys() {
	$(document).keydown(function(e) {
		if(e.which === 90 && e.metaKey && e.shiftKey) {
			performUndo("redo");
		} else if(e.which === 90 && e.metaKey) {
			performUndo("undo");
		}
	});
}