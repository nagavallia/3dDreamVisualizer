
/** Create a new audio context */
const context = new (window.AudioContext || window.webkitAudioContext)();

// For compatibility
if (!context.createGain)
  context.createGain = context.createGainNode;
if (!context.createDelay)
  context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor)
  context.createScriptProcessor = context.createJavaScriptNode;

// const freqcanv = document.getElementById('freqcanvas')
// const playbutton = document.getElementById('playbutton')

loadAudio(context, '/songs/shooting_stars.mp3')
.then(buffer => {
  const vizsample = new VisualizerSample(freqcanvas, buffer);
  playbutton.removeAttribute('disabled')
  playbutton.innerHTML = 'Play/pause'

  playbutton.addEventListener('click', () => { vizsample.togglePlayback() });

})
.catch(console.error)