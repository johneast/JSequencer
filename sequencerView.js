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
			st.redraw(0, (st.height * i) + this.topBarHeight, this.bgContext);
		}
	}	
}

Sequencer.prototype.setSequencer = function(sequencer){
	this.sequencer = sequencer;
	// Add event listeners here.
}

SequencerView.prototype.addTrack = function(sequencerTrack){
	var trackView = new SequencerTrackView(this, sequencerTrack);
	this.trackViews.push(trackView);
	this.redrawTracks();
}

// Object responsible for drawing a sequencer track
function SequencerTrackView(sequencerView, sequencerTrack){
	this.track = sequencerTrack;
	this.sequencerView = sequencerView;
	
	
	this.dirty = true;
	
	this.trackPanelGrdStart = '#6D92B0';
	this.trackPanelGrdEnd = '#435F75';
	this.height = 44;
	this.panelWidth = 125;
	
}

SequencerTrackView.prototype.redraw = function(x, y, ctx){

	// Draw the panel on the left
	var panelBtm = y + this.height - 4;
	var gradient = ctx.createLinearGradient(x, y, x, panelBtm );
	gradient.addColorStop(0, this.trackPanelGrdStart);
	gradient.addColorStop(1, this.trackPanelGrdEnd);
	ctx.fillStyle = gradient;
	ctx.fillRect(x, y, this.panelWidth, this.height - 4);
	
	// Small bar at the bottom of the track
	ctx.fillStyle = '#ececec';
	ctx.strokeStyle = '#888';
	ctx.fillRect(x, panelBtm + 0.5, this.sequencerView.width, 3);
	ctx.strokeRect(x, panelBtm + 0.5, this.sequencerView.width, 3);
	dirty = false;
}