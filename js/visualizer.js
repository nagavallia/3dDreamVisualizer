let INC = 0.01;

class SteveMarschnersDreamVisualizer {
  
  /** A visualizer expects loader.music to be an audio buffer */
  constructor(canvas) {
    // For playback
    this.isPlaying = false;
    this.startTime = 0;
    this.startOffset = 0;

    // For analysis
    this.bandan = new FrequencyBandAnalizer()

    // For drawing
    this.canvas = canvas
    this.gl = initializeWebGL(this.canvas)
    this.objects = []
    this.animation_i = 0.0;

    // initialize camera
    this.viewPoint = vec3.fromValues(0.0,0.0,1.0);
    this.viewDir = vec3.fromValues(0.0,0.0,-1.0);
    this.viewUp = vec3.fromValues(0.0,1.0,0.0);
    this.camera = new Camera(this.viewPoint, this.viewDir, this.viewUp, 1.0);

    pointerSetup(this.canvas)

  }

  /**
   * Loads all the resources the visualizer needs and gets
   * things started
   * @return a Promise that resolves to the visualizer itself
   */
  init() {

    const iKick = () => this.bandan.getFrequencyValue(22)
    const iHigh = () => this.bandan.getFrequencyValue(18000)

    return Promise.resolve(new ResourceLoader(this))
      // audio buffer needs to be loaded to 'audio', also load meshes and textures
      .then(loader => loader.loadAudio('audio', '../songs/shooting_stars.mp3', context))
      .then(loader => loader.loadImage('earthImage', 'data/earth.png'))
      .then(loader => loader.load3DObj('sphere_obj', 'sphere.obj'))
      
      // things have been loaded 
      .then(_ => {

        const sphere = new AObject(this.gl, this.sphere_obj, this.earthImage)
        sphere.animation = new Animation(sphere, iKick);
        sphere.animation.addSequence([
            anim.translate(1,0,0),
            anim.compose([
                anim.translate(-1,0,0),
                anim.scale(1,2),
                anim.translate(1, 0, 1)
            ])
        ])

        this.objects.push(sphere)


      })
      .then(_ => initVisualizer(this))
      .then(_ => requestAnimationFrame(this.draw.bind(this)))
      .then(_ => this) // resolve to the visualizer
      .catch(console.error)
  }

  /**
   * Play/pause
   */
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
    }
    this.isPlaying = !this.isPlaying;
  }


  /** Update what we see on screen */
  draw(time) {

    this.animation_i += INC;
    if (this.animation_i > 1.0){
        INC = -0.01;
    } else if (this.animation_i < 0.0){
        INC = 0.01;
    }

    this.bandan.update()
    updateVisualizer(this, time)
    requestAnimationFrame(this.draw.bind(this));
  }

}
