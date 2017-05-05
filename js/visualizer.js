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
    this.particles = []
    this.animation_i = 0.0;
    this.clearColor = [0.1, 0.1, 0.2, 0.0]

    // initialize camera
    this.viewPoint = vec3.fromValues(0.0,0.0,4.0);
    this.viewDir = vec3.fromValues(0.0,0.0,-4.0);
    this.viewUp = vec3.fromValues(0.0,1.0,0.0);
    this.camera = new Camera(this.viewPoint, this.viewDir, this.viewUp, 1.0);

    pointerSetup(this.gl, this.canvas, this.camera)

  }

  /**
   * Loads all the resources the visualizer needs and gets
   * things started
   * @return a Promise that resolves to the visualizer itself
   */
  init() {

    // functions [0,1] for animating to different things
    // const iKick = () => this.bandan.getFrequencyValue(22, ease.inCubic)
    // const iHigh = () => this.bandan.getFrequencyValue(18000, ease.outQuart)
    const iKick = () => this.bandan.getFrequencyValue(22)
    const iHigh = () => this.bandan.getFrequencyValue(18000)
    const iTime = () => this.animation_i

    this.lightHigh = () => this.bandan.getFrequencyValue(18000)
    this.lightKick = () => this.bandan.getFrequencyValue(22)
    this.lightMid = () => this.bandan.getFrequencyValue(4000)

    return Promise.resolve(new ResourceLoader(this))
      // audio buffer needs to be loaded to 'audio', also load meshes and textures
      .then(loader => loader.loadAudio('audio', 'songs/vollekraftvoraus.mp3', context))
      // .then(loader => loader.loadAudio('audio', 'songs/shooting_stars.mp3', context))
      .then(loader => loader.loadImage('earthImage', 'data/earth.png'))
      .then(loader => loader.load3DObj('sphere_obj', 'sphere.obj'))
      
      // things have been loaded 
      .then(_ => {

        const color1 = {
          texture: this.earthImage,
          fillColor: [0.8510, 0.7961, 0.6196],
        }

        const color2 = {
          fillColor: [0.8627, 0.2078, 0.1333],
        }

        const color3 = {
          fillColor: [0.2157, 0.2549, 0.2510],
        }

        this.particles.push(new PObject(this.gl, 1, [0,0,0], 1, [1,0,0], 1000000));
        this.particles.push(new PObject(this.gl, 0.5, [0,0,0], 1, [0,0,1], 2000000));

        /** One sphere */
        // const kick_sphere = new AObject(this.gl, this.sphere_obj, this.earthImage, [1,1,0], [1,1,0])
        // // kick_sphere.transform(transform.translate(1,0,0))
        // kick_sphere.animation = new Animation(kick_sphere, iHigh);
        // kick_sphere.animation.addSequence([
        //     anim.translate(0.75,0.25,0),
        //     anim.compose([
        //         anim.translateFixed(-0.75,-0.25,0),
        //         anim.waves(1,2),
        //         anim.translateFixed(0.75, 0.25, 0)
        //     ]),
        //     anim.compose([
        //         anim.translateFixed(-0.75,-0.25,0),
        //         anim.waves(1,2),
        //         anim.translateFixed(0.75, 0.25, 0)
        //     ]),
        //     anim.compose([
        //         anim.translateFixed(-0.75,-0.25,0),
        //         anim.waves(1,2),
        //         anim.translateFixed(0.75, 0.25, 0)
        //     ]),
        //     anim.compose([
        //         anim.translateFixed(-0.75,-0.25,0),
        //         anim.waves(1,2),
        //         anim.translateFixed(0.75, 0.25, 0)
        //     ]),
        //     anim.compose([
        //         anim.translateFixed(-0.75,-0.25,0),
        //         anim.waves(1,2),
        //         anim.translateFixed(0.75, 0.25, 0)
        //     ]),
        // ])
        // this.objects.push(kick_sphere)

        // /** Another sphere */
        // const high_sphere = new AObject(this.gl, this.sphere_obj, this.earthImage, [0,1,0])
        // high_sphere.animation = new Animation(high_sphere, iKick);
        // high_sphere.animation.addSequence([
        //     anim.translate(-1,1,0),
        //     anim.compose([
        //         anim.translate(1,-1,0),
        //         anim.spikes2(1,2.5),
        //         anim.translate(-1,1, 0)
        //     ])
        // ])
        // this.objects.push(high_sphere)

        // /** one more */
        // const kick_sphere2 = new AObject(this.gl, this.sphere_obj, this.earthImage, [0,0,1], [1,1,1])
        // kick_sphere2.animation = new Animation(kick_sphere2, iKick);
        // kick_sphere2.animation.addSequence([
        //   anim.translate(1,0,0),
        //   anim.translate(0,1,0),
        //   anim.translate(-2,0,0),
        //   anim.translate(0,-2,0),
        //   anim.translate(2,0,0),
        //   anim.translate(0,2,0)
        // ])
        // this.objects.push(kick_sphere2)


        // const time_sphere = new AObject(this.gl, this.sphere_obj, this.earthImage)
        // time_sphere.animation = new Animation(time_sphere, iTime);
        // time_sphere.animation.addSequence([
        //   anim.translate(1,0,0),
        //   anim.translate(0,1,0),
        //   anim.translate(-2,0,0),
        //   anim.translate(0,-2,0),
        //   anim.translate(2,0,0),
        //   anim.translate(0,2,0)
        // ])
        // this.objects.push(time_sphere)

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

    } else {
      this.source = context.createBufferSource();
      this.startTime = context.currentTime;

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
