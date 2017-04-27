
const WIDTH = 640;
const HEIGHT = 360;
const SMOOTHING = 0.8;
const FFT_SIZE = 2048;

/**
 * Loads an audio file to an audio context
 */
const loadAudio = (context, path) => new Promise((res, rej) => {
  const request = new XMLHttpRequest()
  request.open("GET", path, true)
  request.responseType = "arraybuffer"
  request.onerror = () => alert('BufferLoader: XHR error');
  
  // Load and decode
  request.onload = () => context
    .decodeAudioData(request.response,
      buffer => {
        if (!buffer) rej('error decoding file data: ' + url)
        else res(buffer)
      },
      error => rej(error)
  );
  request.send();
})

/**
 * Wraps an analizer node for easy access to a stream's
 * frequency data. 
 */
class FrequencyBandAnalizer {
  constructor() {
    this.analyser = context.createAnalyser()
    this.analyser.minDecibels = -140
    this.analyser.maxDecibels = 0
    this.analyser.smoothingTimeConstant = SMOOTHING;
    this.analyser.fftSize = FFT_SIZE;

    this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  }

  get frequencyBinCount() { return this.analyser.frequencyBinCount }

  setSource(source) {
    this.source = source
    this.source.connect(this.analyser);
  }

  /** [20, 20,000] -> [0 -> 255] */
  getFrequencyValue(freq) {
    const nyquist = context.sampleRate/2;
    const index = Math.floor(freq/nyquist * this.freqs.length);
    return this.freqs[index];
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
  constructor() {
    this.bandan = new FrequencyBandAnalizer()
    this.freqs = new Uint8Array(this.bandan.frequencyBinCount);
    this.isPlaying = false;
    this.startTime = 0;
    this.startOffset = 0;

    loadAudio(context, 'songs/shooting_stars.mp3')
    .then(buffer => {
      this.audio = buffer
      const button = document.querySelector('button')
      button.removeAttribute('disabled')
      button.innerHTML = 'Play/pause'
    })
    .catch(console.error)
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

    this.bandan.update()
  
    // Get the frequency data from the currently playing music
    const width = Math.floor(1/this.freqs.length, 10);
    const canvas = document.querySelector('canvas');
    const drawContext = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    // Draw the frequency domain chart.
    for (var i = 0; i < this.bandan.frequencyBinCount; i++) {
      const value = this.bandan.freqs[i];
      const percent = value / 256;
      const height = HEIGHT * percent;
      const offset = HEIGHT - height - 1;
      const barWidth = WIDTH/this.bandan.frequencyBinCount;
      const hue = i/this.bandan.frequencyBinCount * 360;
      drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
      drawContext.fillRect(i * barWidth, offset, barWidth, height);
    }

    const a = this.bandan.getFrequencyValue(30)
    const b = this.bandan.getFrequencyValue(22000)
    drawContext.rect(a,20,b,100);
    drawContext.stroke();
  
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
