// Sequencer controls playback of the song
// A sequencer has several SequencerTrack objects
function Sequencer(){

	this.audio = new webkitAudioContext();

	this.mixer = new Mixer(this.audio);

	this.songPos = 0;
	this.songLength = 0;
	
	this.tracks = new Array();
	
	this.playing = false;
	this.playStartTime = 0;
	
	this.view = null;
}

Sequencer.prototype.attachView = function(sequencerView){
	this.view = sequencerView;
	sequencerView.sequencer = this;
}

Sequencer.prototype.addTrack = function(trackName, url){
	var track = new SequencerTrack(this, trackName, this.tracks.length);
	this.tracks.push(track);
	this.view.addTrack(track);
	track.loadAudio(url);
}

Sequencer.prototype.trackLoadedAudio = function(track){
	// The track has loaded audio.

	
}

// Starts playback from the current position
// Calls 'start' on all the tracks in the sequencer
Sequencer.prototype.play = function(){
	if(!this.playing){
		this.playing = true;
		// re create all the source buffer nodes and connect to the input of the mixer
		for(var i = 0; i < this.tracks.length; i++){
			this.tracks[i].createBufferSource();
			this.mixer.connectSequenceTrack(i,this.tracks[i]);
		}
		
		// Get the playStartTime
		this.playStartTime = this.audio.currentTime;
		
		var playDuration = this.songLength - this.songPos;
		if(playDuration > 0){
			// Start all the buffers running
			for(var i = 0; i < this.tracks.length; i++){
				this.tracks[i].start(this.songPos, playDuration);
			}
		}
		
		// Start off any timers.
		
		
	}
}

// Stops playback
Sequencer.prototype.stop = function(){
	if(this.playing){
		for(var i = 0; i < this.tracks.length; i++){
			this.tracks[i].stop();
		}
	}
}

// Stops playback and resets the song position, allowing it to be played from the beginning
Sequencer.prototype.rewind = function(){
	this.stop();
	this.songPos = 0;
}

// A sequencer track holds the audio data
function SequencerTrack(sequencer, trackName, trackNumber){
	this.sequencer = sequencer;
	this.dataUrl = "";
	this.trackName = trackName;
	this.trackNumber = trackNumber;
	
	// The audio data.
	this.dataBuffer = 0;
	// buffer source node. One hit wonder
	this.bufferSourceNode = 0;
	
	this.loaded = false;
	
	// Number of samples
	this.length = 0;
	
	// Duration in seconds
	this.duration = 0;
	
}

SequencerTrack.prototype.start = function(offset, duration){
	this.bufferSourceNode.noteOn(0, offset, duration);
}

SequencerTrack.prototype.stop = function(){
	this.bufferSourceNode.noteOff(0);
}

SequencerTrack.prototype.createBufferSource = function(){
	this.bufferSourceNode = this.sequencer.audio.createBufferSource();
	this.bufferSourceNode.buffer = this.dataBuffer;
}

SequencerTrack.prototype.loadAudio = function(url){
	this.dataUrl = url;
	
	// Go get the audio data
	var request = new XMLHttpRequest();
	request.open("GET", this.dataUrl, true);
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

