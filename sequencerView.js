/*
offscreen rendering example
var renderToCanvas = function (width, height, renderFunction) {
    var buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    renderFunction(buffer.getContext('2d'));
    return buffer;
};



var cached = renderToCanvas(512, 512, function (ctx) {
    ctx.whatever();
});
[...]
context.drawImage(cached, 0, 0);
*/


// Object responsible for drawing the sequencer and all it's tracks.
function SequencerView(){
	
	this.sequencer = null;
	this.trackViews = new Array();
	
	this.bgCanvas = $('#seqBg')[0];
	this.bgContext = this.bgCanvas.getContext('2d');
	this.fgCanvas = $('#seqFg')[0];
	this.fgContext = this.fgCanvas.getContext('2d');
	
	// Set the canvas size.
	this.width = 1024;
	this.height = 600;

	// Some constants
	
	this.bgColor = '#bbb';
	
	this.topBarGrdStart = '#F2F2F2';
	this.topBarGrdMid = '#C9C9C9';
	this.topBarGrdEnd = '#BDBEBF';
	this.topBarUnderline = '#919191';
	this.topBarHeight = 12;
	
	this.cursorColor = '#FF7700';
	this.currentCursorPos = 0;
	
	
	this.redraw();
}

SequencerView.prototype.setSequencer = function(sequencer){
	this.sequencer = sequencer;
	// Attach event handlers for redrawing ?
}

SequencerView.prototype.redraw = function(){
	// Setting canvas size clears it.
	this.bgCanvas.width = this.width;
	this.bgCanvas.height = this.height;
	this.fgCanvas.width = this.width;
	this.fgCanvas.height = this.height;
	
	// draw the background.
	this.bgContext.fillStyle = this.bgColor;
	this.bgContext.fillRect(0,0,this.width, this.height);
	
	// bar at the top.
	var gradient = this.bgContext.createLinearGradient(0, 0, 0, this.topBarHeight);
	gradient.addColorStop(0, this.topBarGrdStart);
	gradient.addColorStop(0.5, this.topBarGrdMid);
	gradient.addColorStop(1, this.topBarGrdEnd);
	this.bgContext.fillStyle = gradient;
	this.bgContext.fillRect(0, 0, this.width, this.topBarHeight);
	
	this.bgContext.beginPath();
	this.bgContext.strokeStyle = this.topBarUnderline;
	this.bgContext.moveTo(0,this.topBarHeight - 0.5);
	this.bgContext.lineTo(this.width, this.topBarHeight - 0.5);
	this.bgContext.stroke();
	this.bgContext.closePath();
	
	// then draw the tracks that need redrawing
	this.redrawTracks();
	
}

SequencerView.prototype.redrawTracks = function(){
	for(var i =0; i < this.trackViews.length; i++){
		var st = this.trackViews[i];
		if(st.dirty){
			st.redraw(this.bgContext);
		}
	}	
}

SequencerView.prototype.setSequencer = function(sequencer){
	this.sequencer = sequencer;
	// Add event listeners here.
	sv = this;
	
	sequencer.addEventListener("trackChanged", function(e){
		sv.trackChanged(e.data);
	});
}

SequencerView.prototype.addTrack = function(sequencerTrack){
	var trackView = new SequencerTrackView(this, sequencerTrack);
	this.trackViews.push(trackView);
	trackView.left = 0;
	trackView.top = trackView.height * (this.trackViews.length - 1) + this.topBarHeight;
	this.redrawTracks();
}

SequencerView.prototype.trackChanged = function(sequencerTrack){
	var tv = this.findViewForTrack(sequencerTrack);
	if(tv){
		tv.redraw(this.bgContext);
	}
}

SequencerView.prototype.findViewForTrack = function(sequencerTrack){
	for(var i = 0; i < this.trackViews.length; i++){
		if(this.trackViews[i].track = sequencerTrack){
			return this.trackViews[i];
		}
	}
}

SequencerView.prototype.redrawCursor = function(){
	// Calculate the position of the cursor based on the song position
	if(this.sequencer && this.sequencer.songLength > 0){
		// Make sure there is at least 1 track as well.
		if(this.trackViews.length > 0){
			var songWidth = this.width - this.trackViews[0].panelWidth;
			var songStart = this.trackViews[0].panelWidth;
			var xScale = this.sequencer.songLength / songWidth;
			
			var newCursorPos = Math.floor(this.sequencer.getSongPos() / xScale) + 0.5 + songStart; // round to an integer
			if(newCursorPos != this.currentCursorPos){
				// Redraw the cursor.
				// Reset the canvas width in order to clear the canvas
				this.fgCanvas.width = this.width;
				this.fgContext.strokeStyle = this.cursorColor;
				this.fgContext.beginPath();
				this.fgContext.moveTo(newCursorPos, this.trackViews[0].top);
				this.fgContext.lineTo(newCursorPos, this.height);
				this.fgContext.stroke();
				this.fgContext.closePath();
				this.currentCursorPos = newCursorPos;
			}
		}
	}	
}

SequencerView.prototype.update = function(){
	// Called regularly by external timers.
	
	// Update any 'dirty' tracks
	this.redrawTracks();
	
	// Draw the song cursor line
	this.redrawCursor();
}

// Object responsible for drawing a sequencer track
function SequencerTrackView(sequencerView, sequencerTrack){
	this.track = sequencerTrack;
	this.sequencerView = sequencerView;
	
	
	this.dirty = true;
	
	this.left = 0;
	this.top = 0;
	
	this.trackPanelGrdStart = '#6D92B0';
	this.trackPanelGrdEnd = '#435F75';
	this.height = 44;
	this.panelWidth = 125;
	
}

SequencerTrackView.prototype.redraw = function(ctx){

	// Draw the panel on the left
	var panelBtm = this.top + this.height - 4;
	var gradient = ctx.createLinearGradient(this.left, this.top, this.left, panelBtm );
	gradient.addColorStop(0, this.trackPanelGrdStart);
	gradient.addColorStop(1, this.trackPanelGrdEnd);
	ctx.fillStyle = gradient;
	ctx.fillRect(this.left, this.top, this.panelWidth, this.height - 4);
	
	// Small bar at the bottom of the track
	ctx.fillStyle = '#ececec';
	ctx.strokeStyle = '#888';
	ctx.fillRect(this.left, panelBtm + 0.5, this.sequencerView.width, 3);
	ctx.strokeRect(this.left, panelBtm + 0.5, this.sequencerView.width, 3);
	
	// Draw the audio data.
	if(this.track.dataBuffer && this.track.dataBuffer.length > 0){
		var pcm = this.track.dataBuffer.getChannelData(0);
		var pcmLength = pcm.length;
		
		var x = this.left + this.panelWidth;
		var wvfmBottom = 0;
		var wvfmTop = 0;
		var wvfmMid = this.top + ((this.height - 3) / 2);
		var sampleCount = 0;
		var minVal = 0;
		var maxVal = 0;
		var currentSample = 0;
		var samplesPerPixel = pcmLength / (this.sequencerView.width - this.panelWidth);
		var yScale = 1 / ((this.height - 3) / 2);
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#000';
		ctx.beginPath();
		for(var i = 0; i < pcmLength; i ++){
			currentSample = pcm[i];
			if(currentSample < minVal){
				minVal = currentSample;
			}
			
			if(currentSample > maxVal){
				maxVal = currentSample;
			}
			
			if(sampleCount++ >= samplesPerPixel){
				wvfmBottom = wvfmMid + (minVal / yScale);
				wvfmTop = wvfmMid + (maxVal / yScale);
				ctx.moveTo(x + 0.5, wvfmBottom);
				ctx.lineTo(x + 0.5, wvfmTop);
				
				sampleCount = 0;
				minVal = 0;
				maxVal = 0;
				x++;
			}
		}
		ctx.stroke();
		ctx.closePath();
	}
	
	dirty = false;
}