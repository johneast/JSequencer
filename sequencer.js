function Sequencer(){

	this.audio = new webkitAudioContext();

	this.mixer = new Mixer(this.audio);

	this.songPos = 0;
	
	this.tracks = new Array();
}

Sequencer.prototype.addTrack = function(trackName, url){
	var track = new SequencerTrack(this, trackName, this.tracks.length);
	this.tracks.push(track);
	track.loadAudio(url);
}

Sequencer.prototype.trackLoadedAudio = function(track){
	// The track has loaded audio
	
	
}


function SequencerTrack(sequencer, trackName, trackNumber){
	this.sequencer = sequencer;
	this.dataUrl = "";
	this.trackName = trackName;
	this.trackNumber = trackNumber;
	
	// The audio data.
	this.dataBuffer = 0;
	
	this.loaded = false;
	
	// Number of samples
	this.length = 0;
	
	// Duration in seconds
	this.duration = 0;
	
	
}

SequencerTrack.prototype.loadAudio = function(url){
	this.dataUrl = url;
	
	// Go get the audio data
	var request = new XMLHttpRequest();
	request.open("GET", dataUrl, true);
	request.responseType = "arraybuffer";
	
	var track = this;
		
	request.onload = function() {
		// Data loaded, decode it to PCM.
		// By default, each track is mono.
		track.dataBuffer = track.sequencer.audio.createBuffer(request.response, true);
		track.loaded = true;
		track.length = track.dataBuffer.length;
		track.duration = track.dataBuffer.duration;
		// Tell the sequencer that the track has loaded the data
		track.sequencer.trackLoadedAudio(track);
	}

	request.send();

}

