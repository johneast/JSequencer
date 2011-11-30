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
	
	// then draw the tracks
}

SequencerView.prototype.addTrack = function(sequencerTrack){
	var trackView = new SequencerTrackView(this, sequencerTrack);
	this.trackViews.push(trackView);
}

// Object responsible for drawing a sequencer track
function SequenceTrackView(sequencerView, sequencerTrack){
	this.track = sequencerTrack;
	this.sequencerView = sequencerView;
	
	this.height = 44;
	
	this.dirty = true;
}