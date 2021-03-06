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
	
	// Some size and color constants
	this.bgColor = '#bbb';
	
	this.topBarGrdStart = '#F2F2F2';
	this.topBarGrdMid = '#CFCFCF';
	this.topBarGrdEnd = '#8D8E8F';
	this.topBarUnderline = '#919191';
	this.topBarHeight = 12;
	this.trackPanelWidth = 125;
	this.trackHeight = 44;
	this.trackSeparatorHeight = 4;
	
	this.cursorColor = '#FF7700';
	
	
	
	this.bgCanvas = $('#seqBg')[0];
	this.bgContext = this.bgCanvas.getContext('2d');
	this.fgCanvas = $('#seqFg')[0];
	this.fgContext = this.fgCanvas.getContext('2d');
	
	var self = this;
	// Event handlers
	$('#seqFg').mousedown(function(event){
		self.canvasClick(event);
	});
		
	// Set the canvas size.
	this.width = 1024;
	this.height = this.trackHeight * 8 + this.topBarHeight;

	// Some constants
	
	this.currentCursorPos = 0;
	
	
	this.redraw();
}

SequencerView.prototype.findViewForTrack = function(track){
	for(var i = 0; i < this.trackViews.length; i++){
		var tv = this.trackViews[i];
		if(tv.track == track){
			return tv;
		}
	}
	return null;
}

SequencerView.prototype.canvasClick = function(event){
	// Where was the mouse clicked?
	
	var y = event.offsetY;
	var x = event.offsetX;
	// was it in the top bar?
	if(y < this.topBarHeight){
		this.topBarClick(x);
	}else if(x < this.trackPanelWidth) {
		// Clicked in the panels on the left.
		this.trackPanelClick(x, y);
	}
}

SequencerView.prototype.topBarClick = function(x){
	// Shoud we change the song position
	if(x >= this.trackPanelWidth){
		var barClickPos = x - this.trackPanelWidth;
		
		var songDuration = this.sequencer.songLength;
		
		var vv = songDuration / (this.width - this.trackPanelWidth);
		
		var newSongPos = vv * barClickPos;
		
		this.sequencer.setSongPos(newSongPos);
		
	}
}

SequencerView.prototype.trackPanelClick = function(x, y){
	// Find which track was clicked
	for(var i = 0; i < this.trackViews.length; i++){
		var tv = this.trackViews[i];
		if(y >= tv.trackTop && y < (tv.trackTop + (tv.height - this.trackSeparatorHeight))){
			// pass on to the track view
			tv.click(x - tv.left, y - tv.trackTop);
			this.sequencer.selectTrack(i);
			return;
		}
	}
}

SequencerView.prototype.trackSelected = function(e){
	var tv = this.findViewForTrack(e.data);
	if(tv){
		tv.dirty = true;
		
		// Update the EQ settings for this track
		if(this.sequencer.mixer.mixerView){
		
			this.sequencer.mixer.mixerView.updateEQSettingsForChannel(e.data.trackNumber);
		}
	}
	//this.redrawTracks();
}

SequencerView.prototype.trackUnselected = function(e){
	var tv = this.findViewForTrack(e.data);
	if(tv){
		tv.dirty = true;
	}
	// The track selected event should follow soon. Only redraw when that arrives
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
		if(st.dirty == true){
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
	
	this.sequencer.addEventListener("trackSelected", function(e){
		sv.trackSelected(e);
	});
	
	this.sequencer.addEventListener("trackUnselected", function(e){
		sv.trackUnselected(e);
	});
}

SequencerView.prototype.addTrack = function(sequencerTrack){
	logDebug('Adding track '+sequencerTrack.trackName);
	var trackView = new SequencerTrackView(this, sequencerTrack);
	this.trackViews.push(trackView);
	trackView.left = 0;
	trackView.trackTop = trackView.height * (this.trackViews.length - 1) + this.topBarHeight;
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
		if(this.trackViews[i].track == sequencerTrack){
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
				this.fgContext.moveTo(newCursorPos, this.trackViews[0].trackTop);
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
	this.trackTop = 0;
	
	this.trackPanelGrdStart = '#6D92B0';
	this.trackPanelGrdEnd = '#435F75';
	this.height = this.sequencerView.trackHeight;
	this.panelWidth = this.sequencerView.trackPanelWidth;
	this.separatorHeight = this.sequencerView.trackSeparatorHeight;
	this.selectedColor = '#F7FF03';
	this.unselectedColor = '#EDEDE6';
	this.bgSelectecColor = '#fff';
	this.bgUnselectedColor = this.sequencerView.bgColor;
	
	this.soloColor = '#FF7700';
	this.unsoloColor = '#f2f2f2';
	
	this.soloBtnWidth = 12;
	this.soloBtnHeight = 12;
	
	this.soloBtnLeft = this.panelWidth - this.soloBtnWidth - 4 + this.trackTop;
	this.soloBtnTop = ((this.height - this.separatorHeight) / 2) - (this.soloBtnHeight / 2);
	
}

SequencerTrackView.prototype.redraw = function(ctx){

	// Track background
	ctx.fillStyle = this.track.selected ? this.bgSelectedColor : this.bgUnselectedColor;
	ctx.fillRect(this.left, this.trackTop, this.sequencerView.width, this.height);
	
	// Draw the panel on the left
	var panelBtm = this.trackTop + this.height - 4;
	var gradient = ctx.createLinearGradient(this.left, this.trackTop, this.left, panelBtm );
	gradient.addColorStop(0, this.trackPanelGrdStart);
	gradient.addColorStop(1, this.trackPanelGrdEnd);
	ctx.fillStyle = gradient;
	ctx.fillRect(this.left, this.trackTop, this.panelWidth, this.height - this.separatorHeight);
	
	// Draw the selection indicator
	ctx.fillStyle = this.track.selected ? this.selectedColor : this.unselectedColor;
	ctx.fillRect(this.left, this.trackTop, 4, this.height - this.separatorHeight);
	
	// Draw the name of the track
	ctx.fillStyle = '#fff';
	ctx.font = '14px sans-serif';
	ctx.baseLine = 'middle';
	ctx.fillText(this.track.trackName, this.left + 10, this.trackTop + (this.height / 2));
	
	// Draw the solo button
	var trackSolo = this.sequencerView.sequencer.mixer.getMixerChannel(this.track.trackNumber).solo;
	var gradient = ctx.createLinearGradient(this.soloBtnLeft, 
		this.soloBtnTop + this.trackTop, this.soloBtnLeft, this.soloBtnTop + this.trackTop + this.soloBtnHeight);
	
	var soloClr = trackSolo ? this.soloColor : this.unsoloColor;
	gradient.addColorStop(0, soloClr);
	gradient.addColorStop(0.5, this.unsoloColor);
	gradient.addColorStop(1, soloClr);
	ctx.fillStyle = gradient;
	ctx.fillRect(this.soloBtnLeft, this.soloBtnTop + this.trackTop, this.soloBtnWidth, this.soloBtnHeight);
	
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
		var wvfmMid = this.trackTop + ((this.height - 3) / 2);
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
	this.dirty = false;
}

SequencerTrackView.prototype.click = function(x, y){
	// Has the solo button been pressed
	if(x >= this.soloBtnLeft && x < (this.soloBtnLeft + this.soloBtnWidth)){
		if(y >= this.soloBtnTop && y < (this.soloBtnTop + this.soloBtnHeight)){
			this.soloBtnClick();
		}
	}
}

SequencerTrackView.prototype.soloBtnClick = function(){
	this.track.sequencer.mixer.toggleSoloForChannel(this.track.trackNumber);
	this.dirty = true;
}

function MixerView(numberOfChannels){
	this.mixer = null;
	
	// Set up the UI
	var self = this;
	
	this.channelViews = new Array();
	for(var i = 0; i < numberOfChannels; i++){
		var cv = new MixerChannelView(i,this);
		this.channelViews.push(cv);
	}
	
	this.setupEq();

}	

MixerView.prototype.setMixer = function(mixer){
	this.mixer = mixer;
}

MixerView.prototype.setupEq = function(){
	var self = this;
	$('#eqLowShelfGain > span').each(function() {
		$(this).empty().slider({
			value: 50,
			range: "min",
			animate: true,
			orientation: "vertical",
			slide: function (event, ui){
				self.mixer.setLowShelfGain((ui.value - 50) / 2.5);
			}
		});
	});
	
	$('#eqLowMidBandGain > span').each(function() {
		$(this).empty().slider({
			value: 50,
			range: "min",
			animate: true,
			orientation: "vertical",
			slide: function (event, ui){
				self.mixer.setLowMidBandGain((ui.value - 50) / 2.5);
			}
		});
	});
	
	$('#eqHiMidBandGain > span').each(function() {
		$(this).empty().slider({
			value: 50,
			range: "min",
			animate: true,
			orientation: "vertical",
			slide: function (event, ui){
				self.mixer.setHiMidBandGain((ui.value - 50) / 2.5);
			}
		});
	});
		
	$('#eqHiShelfGain > span').each(function() {
		$(this).empty().slider({
			value: 50,
			range: "min",
			animate: true,
			orientation: "vertical",
			slide: function (event, ui){
				self.mixer.setHiShelfGain((ui.value - 50) / 2.5);
			}
		});
	});
};

MixerView.prototype.updateEQSettingsForChannel = function(channelNumber){
	var channel = this.mixer.getMixerChannel(channelNumber);
	if(channel){
		// Set the value of the low shelf gain.
		$('#eqLowShelfGain > span').each(function() {
			$(this).slider("value", (channel.lowShelf.gain.value * 2.5) + 50);
		});
		
		$('#eqLowMidBandGain > span').each(function() {
			$(this).slider("value", (channel.lowMidBand.gain.value * 2.5) + 50);
		});
		
		$('#eqHiMidBandGain > span').each(function() {
			$(this).slider("value", (channel.hiMidBand.gain.value * 2.5) + 50);
		});
		$('#eqHiShelfGain > span').each(function() {
			$(this).slider("value", (channel.hiShelf.gain.value * 2.5) + 50);
		});
		
	}

}

function MixerChannelView(channelId, mixerView){
	
	this.channelId = channelId;
	this.mixerView = mixerView;
	
	var self = this;	
	// Setup the slider on the page and catch the event for the slider changing
	// On the page the channels are indexed by 1, but really, they are indexed by 0
	$("#mixerChannel"+(this.channelId+1)+" > span").each(function() {
		// intiialise at 80%
		$( this ).empty().slider({
			value: 80,
			range: "min",
			animate: true,
			orientation: "vertical",
			slide: function( event, ui ) {
				self.sliderSetVolume(ui.value);
			}
		});
	});
}

MixerChannelView.prototype.sliderSetVolume = function(value){
	// Slider value changed
	this.mixerView.mixer.setChannelVolume(this.channelId , value / 100);
}

