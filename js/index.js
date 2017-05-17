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
  // playbutton.removeAttribute('disabled')
  // playbutton.innerHTML = 'Play/pause'
  // playbutton.addEventListener('click', () => { visualizer.togglePlayback() });
  document.addEventListener('keypress', (event) => {if (event.key == 'p'){ visualizer.togglePlayback() } else if (event.key == 'u'){ visualizer.explode()}})
})
.catch(console.error)

const sel_builtin_audio = path => loadAudio(context, path).then(audio => {
  visualizer.setAudio(audio)
})

$("#songChoice").change(function (){
  var selectedsong = $("#selectedsong");
  var songUpload = $("#songChoice")[0];

  if ('files' in songUpload){
    if (songUpload.files.length == 0){
      console.log('no song selected');
    } else {
      var song = songUpload.files[0];
      if ('name' in song){
        selectedsong.text(song.name);
        $("#customsong").prop("checked", true);
        console.log('RIP')
        // var loader = new ResourceLoader(this);
        // loader.loadAudio(name, name, context);
      }
    }
  }
});
