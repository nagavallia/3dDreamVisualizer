
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


/* From: https://gist.github.com/gre/1650294
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
const ease = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  inQuad: t => t*t,
  // decelerating to zero velocity
  outQuad: t => t*(2-t),
  // acceleration until halfway, then deceleration
  inOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  // accelerating from zero velocity 
  inCubic: t => t*t*t,
  // decelerating to zero velocity 
  outCubic: t => (--t)*t*t+1,
  // acceleration until halfway, then deceleration 
  inOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
  // accelerating from zero velocity 
  inQuart: t => t*t*t*t,
  // decelerating to zero velocity 
  outQuart: t => 1-(--t)*t*t*t,
  // acceleration until halfway, then deceleration
  inOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
  // accelerating from zero velocity
  inQuint: t => t*t*t*t*t,
  // decelerating to zero velocity
  outQuint: t => 1+(--t)*t*t*t*t,
  // acceleration until halfway, then deceleration 
  inOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
  // threshold
  threshold: x => t => t < x ? 0 : 1
}


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

    const a = this.bandan.getFrequencyValue(30, ease.inQuad) * 100
    const b = this.bandan.getFrequencyValue(22000, ease.outQuad) * 100
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
