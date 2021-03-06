function Mixer(audioContext){
	this.audio = audioContext;
	this.numberOfChannels = 32;
	this.channels = new Array(this.numberOfChannels);
	this.selected = 0;
	this.soloChannels = new Array();
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

Mixer.prototype.attachView = function(mixerView){
	this.mixerView = mixerView;
	this.mixerView.setMixer(this);
}


Mixer.prototype.connectSequencerTrack = function(channelNumber, sequencerTrack){
	var mc = this.getMixerChannel(channelNumber);
	if(mc){
		sequencerTrack.bufferSourceNode.connect(mc.input);
	}
}

Mixer.prototype.setChannelVolume = function(channelNumber, volume){
	var mc = this.getMixerChannel(channelNumber);
	if(mc){
		mc.setVolume(volume);
	}
}

Mixer.prototype.selectChannel = function(channelNumber){
	this.selected = this.getMixerChannel(channelNumber);
}

Mixer.prototype.setLowShelfGain = function(gain){
	if(this.selected){
		this.selected.lowShelf.gain.value = gain;
	}
}

Mixer.prototype.setLowMidBandGain = function(gain){
	if(this.selected){
		this.selected.lowMidBand.gain.value = gain;
	}
}

Mixer.prototype.setHiMidBandGain = function(gain){
	if(this.selected){
		this.selected.hiMidBand.gain.value = gain;
	}
}

Mixer.prototype.setHiShelfGain = function(gain){
	if(this.selected){
		this.selected.hiShelf.gain.value = gain;
	}
}

Mixer.prototype.toggleSoloForChannel = function(channelNumber){
	var mc = this.getMixerChannel(channelNumber);
	if(mc){
		mc.solo = !mc.solo;
		if(mc.solo){
			this.soloChannels.push(mc);
		}else{
			for(var i = 0; i < this.soloChannels.length; i++){
				if(this.soloChannels[i] == mc){
					this.soloChannels.splice(i);
					break;
				}
			}
		}
		this.applySolos()
	}
}


Mixer.prototype.applySolos = function(){
	// Any channel that's not solo'd should be muted.
	for(var i = 0; i < this.channels.length; i++){
		var mc = this.channels[i];
		if(mc){
			if(this.soloChannels.length == 0){
				// No channels solo'd, make sure every channel is unmuted
				if(mc.channelVolume != mc.volume.gain.value){
					mc.volume.gain.value = mc.channelVolume;
				}
			}else{
				if(!mc.solo){
					mc.volume.gain.value = 0;
				}else{
					mc.volume.gain.value = mc.channelVolume;
				}
			}
		}
	}
}

function MixerChannel(mixer){

	this.mixer = mixer;
	
	//this.panner = this.mixer.audio.createPanner();
	
	// Low shelf filter
	this.lowShelf = this.mixer.audio.createBiquadFilter();
	this.lowShelf.type = this.lowShelf.LOWSHELF;
	this.lowShelf.frequency.value = 154.0;
	this.lowShelf.gain.value = 0;
	
	// low mid band
	this.lowMidBand = this.mixer.audio.createBiquadFilter();
	this.lowMidBand.type = this.lowMidBand.PEAKING;
	this.lowMidBand.frequency.value = 632.0;
	this.lowMidBand.gain.value = 0;
	
	// high mid band
	this.hiMidBand = this.mixer.audio.createBiquadFilter();
	this.hiMidBand.type = this.hiMidBand.PEAKING;
	this.hiMidBand.frequency.value = 2050.0;
	this.hiMidBand.gain.value = 0;
	
	// high shelf
	this.hiShelf = this.mixer.audio.createBiquadFilter();
	this.hiShelf.type = this.hiShelf.HIGHSHELF;
	this.hiShelf.frequency.value = 5750;
	this.hiShelf.gain.value = 0;
	
	// Main channel volume
	this.volume = this.mixer.audio.createGainNode();
	
	// Connect all the nodes
	// Loshelf -> LowMid -> HighMid -> HighShelf
	this.lowShelf.connect(this.hiShelf);
//	this.lowMidBand.connect(this.hiShelf);
	//this.hiMidBand.connect(this.hiShelf);
	this.hiShelf.connect(this.volume);
	
	
	this.input = this.lowShelf;
	//this.input = this.volume;
	this.output = this.volume;
	this.solo = false;
	this.channelVolume = this.volume.gain.value;
}

MixerChannel.prototype.setVolume = function(volume){
	this.channelVolume = volume;
	this.volume.gain.value = volume;
}