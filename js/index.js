

/*********************************** jquery **********************************/
var lookSlider = $("#lookSlider");

lookSlider.slider({
    min: 25,
    max: 100,
    value: 50
});

var movementSlider = $("#movementSlider");

movementSlider.slider({
    min: 0,
    max: 23,
    value: 15
});

var invertVert = $("#invertLook")[0].checked;
var invertHoriz = $("#invertHoriz")[0].checked;

/*********************************** audio ***********************************/

/** Create a new audio context */
const context = new (window.AudioContext || window.webkitAudioContext)();

// For compatibility
if (!context.createGain)
  context.createGain = context.createGainNode;
if (!context.createDelay)
  context.createDelay = context.createDelayNode;
if (!context.createScriptProcessor)
  context.createScriptProcessor = context.createJavaScriptNode;

/** Create and start the visualizer */
const visualizer = new SteveMarschnersDreamVisualizer($("#webglCanvas")[0])

visualizer
.init()
.then(() => loadAudio(context, 'data/songs/vollekraftvoraus.mp3'))
.then(audio => {
  visualizer.setAudio(audio)
})
.then(() => {
  //playbutton.removeAttribute('disabled')
  //playbutton.innerHTML = 'Play/pause'
  //playbutton.addEventListener('click', () => { visualizer.togglePlayback() });
  document.addEventListener('keydown', (event) => {if (event.key == 'p'){ visualizer.togglePlayback(); } else if (event.key == 'u'){ visualizer.explode()}})
})
.catch(console.error)

const sel_builtin_audio = path => loadAudio(context, path).then(audio => {
  visualizer.setAudio(audio)
})

const sel_file_audio = files => {
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (isChrome) return alert("Chrome can't do custom audio, sorry!")
  var file = files[0];
  if (!file.type.match(/audio.*/)) return;
  var reader = new FileReader();
  reader.onload = d => context
    .decodeAudioData(d.target.result,
      buffer => {
        if (!buffer) console.error('error decoding file data: ' + name)
        else visualizer.setAudio(buffer)
      }, console.error)
  reader.readAsArrayBuffer(file);
}
