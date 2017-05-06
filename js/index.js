
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

const playbutton = document.getElementById('playbutton')

/** Create and start the visualizer */
const visualizer = new SteveMarschnersDreamVisualizer($("#webglCanvas")[0])

visualizer
.init()
.then((viz) => {
  playbutton.removeAttribute('disabled')
  playbutton.innerHTML = 'Play/pause'
  playbutton.addEventListener('click', () => { visualizer.togglePlayback() });
  document.addEventListener('keypress', (event) => {if (event.key == 'p'){ visualizer.togglePlayback() }})

  // $("#slider").slider({ slide: function(event, ui) { console.log('play at', ui.value) } })
  // $("#slider").slider('option', {min: 0, max: viz.duration })

  // viz.playFromTag()

})
.catch(console.error)
