
/**
 * Wraps an analizer node for easy access to a stream's
 * frequency data. 
 */
class FrequencyBandAnalizer {
  constructor(options = {}) {
    const FFT_SIZE = 2048;
    const SMOOTHING = 0.8;

    this.analyser = context.createAnalyser()
    this.analyser.minDecibels = -140
    this.analyser.maxDecibels = 0
    this.analyser.smoothingTimeConstant = options.smoothing || SMOOTHING;
    this.analyser.fftSize = options.ftt_size || FFT_SIZE;

    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  }

  get frequencyBinCount() { return this.analyser.frequencyBinCount }

  setSource(source) {
    this.source = source
    this.source.connect(this.analyser);
  }

  /** [20, 20,000] -> [0, 1] */
  getFrequencyValue(freq, easing) {
    easing = easing || ease.linear
    const nyquist = context.sampleRate/2;
    const index = Math.floor(freq/nyquist * this.freqs.length);
    return easing(this.freqs[index]/255);
  }

  update() {  
    // Get the frequency data from the currently playing music
    this.analyser.getByteFrequencyData(this.freqs);
  }
}


/**
 * Sample visualizer I found online
 */
class VisualizerSample {
  constructor(canvas, buffer) {
    this.bandan = new FrequencyBandAnalizer()
    this.freqs = new Uint8Array(this.bandan.frequencyBinCount);
    this.isPlaying = false;
    this.startTime = 0;
    this.startOffset = 0;
    this.canvas = canvas
    this.audio = buffer
    this.drawContext = this.canvas.getContext('2d');
  }

  togglePlayback() {
    if (this.isPlaying) {
      // Stop playback and save the position of the playhead
      this.source.stop(0);
      this.startOffset += context.currentTime - this.startTime;
      console.log('paused at', this.startOffset);
      
    } else {
      this.source = context.createBufferSource();
      this.startTime = context.currentTime;
      console.log('started at', this.startOffset);

      // Connect graph
      this.source.buffer = this.audio;
      this.source.loop = true;
      this.bandan.setSource(this.source)
      this.source.connect(context.destination)
      // Start playback, but make sure we stay in bound of the buffer.
      this.source.start(0, this.startOffset % this.audio.duration);
      // Start visualizer.
      requestAnimationFrame(this.draw.bind(this));
    }
    this.isPlaying = !this.isPlaying;
  }

  draw() {

    // clear canvas
    // this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = this.canvas.width

    // Get the frequency data from the currently playing music
    this.bandan.update()
  
    // draw box
    const a = this.bandan.getFrequencyValue(30, ease.inQuad) * 100
    const b = this.bandan.getFrequencyValue(22000, ease.outQuad) * 100
    this.drawContext.rect(a,20,b,100);
    this.drawContext.stroke();

    // Draw the frequency domain chart.
    for (var i = 0; i < this.bandan.frequencyBinCount; i++) {
      const value = this.bandan.freqs[i];
      const percent = value / 256;
      const height = this.canvas.height * percent;
      const offset = this.canvas.height - height - 1;
      const barWidth = this.canvas.width/this.bandan.frequencyBinCount;
      const hue = i/this.bandan.frequencyBinCount * 360;
      this.drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
      this.drawContext.fillRect(i * barWidth, offset, barWidth, height);
    }

    if (this.isPlaying) {
      requestAnimationFrame(this.draw.bind(this));
    }
  }

  getFrequencyValue(freq) {
    const nyquist = context.sampleRate/2;
    const index = Math.round(freq/nyquist * this.freqs.length);
    return this.freqs[index];
  }
}
