function Mixer(audioContext){
	this.audio = audioContext;
	this.numberOfChannels = 32;
	this.channels = new Array(this.numberOfChannels);
}

Mixer.prototype.getMixerChannel = function(number){
	var mc = null;
	if(number < this.numberOfChannels){
		mc = this.channels[number];
		if(!mc){
			mc = new MixerChannel(this);
			this.channels[number] = mc;
			mc.output.connect(this.audio.destination);
		}
	}
	return mc;
}


Mixer.prototype.connectSequencerTrack = function(channelNumber, sequencerTrack){
	var mc = this.getMixerChannel(channelNumber);
	if(mc){
		sequencerTrack.bufferSourceNode.connect(mc.input);
	}
}

function MixerChannel(mixer){

	this.mixer = mixer;
	
	//this.panner = this.mixer.audio.createPanner();
	
	// Low pass filter
	this.lpFilter = this.mixer.audio.createBiquadFilter();
	this.lpFilter.type = this.lpFilter.LOWPASS;
	this.lpFilter.frequency.value = 100;
	this.volume = this.mixer.audio.createGainNode();
	
	this.lpFilter.connect(this.volume);
	//this.panner.connect(this.volume);
	
	//this.input = this.panner;
	this.input = this.lpFilter;
	this.output = this.volume;
}