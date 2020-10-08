var progressBar = {
	elemOuter: document.getElementById("progressbar-outer"),
	elemInner: document.getElementById("progressbar"),
	buffer: document.getElementById("bufferbar"),
	value: 0,
	bufferValue: 0,
	hovering: false,
	firstSeek: false,
	
	setValue: function(value) {
		if (value < 0) {
			value = 0;
		}
		else if (value > 100) {
			value = 100;
		}
		
		progressBar.value = value;
		progressBar.elemInner.style.width = value+"%";
		progressBar.elemInner.setAttribute("value", value);
	},
	
	getValue: function() {
		return progressBar.value;
	},
	
	setValueBuffer: function(value) {
		if (value < 0) {
			value = 0;
		}
		else if (value > 100) {
			value = 100;
		}
		
		progressBar.bufferValue = value;
		progressBar.buffer.style.width = value+"%";
		progressBar.buffer.setAttribute("value", value);
		
		if (value >= 100) {
			progressBar.buffer.style.backgroundColor = "rgba(0,0,0,0)";
		}
		else {
			progressBar.buffer.style.backgroundColor = null;
		}
	},
	
	progressMouseEnter: function(e) {
		e=e || window.event;
		if ((e.which == 1 || e.type == "touchstart")) {
			progressBar.firstSeek = true;
			// spotifyHandler.api.pause();
			progressBar.hovering = true;
			progressBar.elemInner.style.transition = "none";
			$(progressBar.elemInner).addClass("hovering");
			window.addEventListener("mousemove", progressBar.progressMouseMove);
			window.addEventListener("touchmove", progressBar.progressMouseMove);
			window.addEventListener("mouseup", progressBar.progressMouseLeave);
			window.addEventListener("touchend", progressBar.progressMouseLeave);
			window.addEventListener("touchcancel", progressBar.progressMouseLeave);
			
			/* Cursor Styling */
			var css = '* { cursor: inherit !important; } body { cursor: w-resize !important; }',
			head = document.head || document.getElementsByTagName('head')[0],
			style = document.createElement('style');
			style.type = 'text/css';
			style.id = 'cursorstyling';
			if (style.styleSheet){
				style.styleSheet.cssText = css;
			}
			else {
				style.appendChild(document.createTextNode(css));
			}
			head.appendChild(style);
			progressBar.progressMouseMoveCalc(e);
		}
	},
	
	pauseEvent: function(e){
		if(e.stopPropagation) e.stopPropagation();
		if(e.preventDefault) e.preventDefault();
		e.cancelBubble=true;
		e.returnValue=false;
		return false;
	},

	
	progressMouseMove: function(e) {
		e=e || window.event;
		if (e.type != "touchstart" && e.type != "touchmove" && e.type != "touchend") {
			progressBar.pauseEvent(e);			// stop selecting and moving text on page
		}
		progressBar.progressMouseMoveCalc(e);
	},
	
	progressMouseMoveCalc: function(e) {
		var progressOffset = $("#progressbar-outer").offset();
		var progressOffsetRight = (document.body.clientWidth - ($("#progressbar-outer").offset().left + $("#progressbar-outer").outerWidth()));
		var progressOffsetLeft = progressOffset.left;
		var progressBorderWidth = ($("#progressbar-outer").outerWidth() - $("#progressbar-outer").innerWidth()) / 2;
		var maxX = ($("#progressbar-outer").offset().left + $("#progressbar-outer").outerWidth());
		var minX = progressOffset.left;
		if (e.type == "touchstart" || e.type == "touchmove" || e.type == "touchend") {
			var x = e.changedTouches[0].pageX;
			var y = e.changedTouches[0].pageY;
		}
		else {
			var x = e.clientX;
			var y = e.clientY;
		}
		
		// add scrollbar position to x to fix bugs when scrolled a bit to the right of the page
		if (window.pageXOffset > 0) {
			x = x + window.pageXOffset;
		}
		else if (document.body.scrollLeft > 0) {
			x = x + document.body.scrollLeft;
		}
		else if (document.documentElement.scrollLeft > 0) {
			x = x + document.documentElement.scrollLeft;
		}
	
		// console.log("x: " + x + "\nminX: " + minX + "\nmaxX: " + maxX);
		
		if (x <= minX) {
			progressBar.progressMouseSet(0);
		}
		else if (x >= maxX) {
			progressBar.progressMouseSet(100);
		}
		else {
			var progressPerc = ((x - progressOffsetLeft - progressBorderWidth) / ($("#progressbar-outer").innerWidth())) * 100;
			progressBar.progressMouseSet(progressPerc);
		}
	},
	
	progressMouseSet: function(val) {
		if (spotifyHandler.duration != 0) {
			progressBar.setValue(val);
			
			var timeToBeSet = (progressBar.getValue() / 100) * spotifyHandler.duration;
			spotifyHandler.updateTimes(timeToBeSet, spotifyHandler.duration);
		}
	},
	
	progressMouseLeave: function(e) {
		progressBar.hovering = false;
		progressBar.elemInner.style.transition = null;
		window.removeEventListener("mousemove", progressBar.progressMouseMove);
		window.removeEventListener("touchmove", progressBar.progressMouseMove);
		window.removeEventListener("mouseup", progressBar.progressMouseLeave);
		window.removeEventListener("touchend", progressBar.progressMouseLeave);
		window.removeEventListener("touchcancel", progressBar.progressMouseLeave);
		$("#cursorstyling").remove();
		$(progressBar.elemInner).removeClass("hovering");
		progressBar.progressMouseMoveCalc(e);
		spotifyHandler.api.seek(Math.floor((progressBar.getValue() / 100) * (spotifyHandler.duration * 1000)), {});
		// spotifyHandler.api.play();
		setTimeout(function() {
			spotifyHandler.setCurrentlyPlaying();
		}, 250);
	},
	
	init: function() {
		progressBar.elemOuter.addEventListener("mousedown", progressBar.progressMouseEnter);
		progressBar.elemOuter.addEventListener("touchstart", progressBar.progressMouseEnter);
	}
};

progressBar.init();