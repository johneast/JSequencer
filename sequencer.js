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
	
	this.eventListeners = new Array();
	
	this.selectedTrack = 0;
}

Sequencer.prototype.attachView = function(sequencerView){
	this.view = sequencerView;
	sequencerView.setSequencer(this);
}

Sequencer.prototype.addEventListener = function(type, fn){
	var l = this.eventListeners[type];
	if(!l){
		l = new Array();
		this.eventListeners[type] = l;
	}
	l.push(fn);
}

Sequencer.prototype.notifyEventListeners = function(e){
	var l = this.eventListeners[e.type];
	if(l){
		for(var i = 0;i < l.length; i++){
			l[i](e);
		}
	}
}

Sequencer.prototype.addTrack = function(trackName, url){
	var track = new SequencerTrack(this, trackName, this.tracks.length);
	this.tracks.push(track);
	
	this.view.addTrack(track);
	// Trigger the track added event
	var e = {type:"trackAdded", data:track };
	this.notifyEventListeners(e);
	
	// If no track is selected, then select this one.
	if(!this.selectedTrack){
		this.selectedTrack = track;
		track.selected = true;
	}

	// Go get the audio data
	track.loadAudio(url);
}

Sequencer.prototype.selectTrack = function(trackIndex){
	if(trackIndex < this.tracks.length && trackIndex >= 0){
		var newSelection = this.tracks[trackIndex];
		if(newSelection != this.selectedTrack){
			if(this.selectedTrack){
				this.selectedTrack.selected = false;
				this.notifyEventListeners({type:"trackUnselected", data:this.selectedTrack });
			}
			
			this.selectedTrack = newSelection;
			this.selectedTrack.selected = true;
			this.notifyEventListeners({type:"trackSelected", data:this.selectedTrack});
		}
		
		this.mixer.selectChannel(trackIndex);
	}
}

Sequencer.prototype.trackLoadedAudio = function(track){
	// The track has loaded audio.
	var trackLength = track.dataBuffer.duration;
	if(trackLength > this.songLength){
		this.songLength = trackLength;
	}
	this.notifyEventListeners({type:"trackChanged", data:track});
	
}

// Starts playback from the current position
// Calls 'start' on all the tracks in the sequencer
Sequencer.prototype.play = function(){
	if(!this.playing){
		
		// Get the playStartTime
		var playDuration = this.songLength - this.songPos;
		if(playDuration > 0){
			this.playing = true;

			// re create all the source buffer nodes and connect to the input of the mixer
			for(var i = 0; i < this.tracks.length; i++){
				this.tracks[i].createBufferSource();
				this.mixer.connectSequencerTrack(i,this.tracks[i]);
			}

			this.playStartTime = this.audio.currentTime;
			// Start all the buffers running
			for(var i = 0; i < this.tracks.length; i++){
				this.tracks[i].start(this.songPos);
			}
		}
	}
}

// Stops playback
Sequencer.prototype.stop = function(){
	if(this.playing){
		this.playing = false;
		this.songPos = this.songPos + (this.audio.currentTime - this.playStartTime);
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

Sequencer.prototype.getSongPos = function(){
	if(!this.playing){
		return this.songPos;
	}else{
		var timeSinceStart = this.audio.currentTime - this.playStartTime;
		
		return this.songPos + timeSinceStart;
	}
}

Sequencer.prototype.setSongPos = function(newSongPos){
	var wasPlaying = this.playing;
	this.stop();
	this.songPos = newSongPos;
	if(wasPlaying){
		this.play();
	}
	
}

// A sequencer track holds the audio data
function SequencerTrack(sequencer, trackName, trackNumber){
	this.sequencer = sequencer;
	this.dataUrl = "";
	this.trackName = trackName;
	this.trackNumber = trackNumber;
	this.selected = false;
	
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

SequencerTrack.prototype.start = function(offset){

	var duration = this.dataBuffer.duration - offset;
	// play now, from the current position for the remaining duration - 1 sample (ish)
	this.bufferSourceNode.noteGrainOn(0, offset, duration - 0.00003);
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

