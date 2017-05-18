let INC = 0.01;

var meshes = [];

function rand_color(){
  colors = [[0,1,0],[1,1,1],[1,0,0],[0,0,1],[0,1,1],[1,1,0],[1,0,1],[1,0.7,0.7],[1,0.7,0.3]]
  return colors[Math.floor(Math.random()*colors.length)];
}

function rand_mesh_and_tex(){
  return meshes[Math.floor(Math.random()*meshes.length)];
}

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
    this.colors = [[1,0.2,0.2],[0.2,1,0.2],[0.2,0.2,1],[1,1,0.2],[1,0.2,1],[0.2,1,1],[1,1,1]];
    this.animation_i = 0.0;
    this.bgColor = [0.2,0.2,0.2, 0.0]
    this.clearColor = this.bgColor;
    this.respawn = [];

    // initialize camera
    this.viewPoint = vec3.fromValues(0.0,0.0,4.0);
    this.viewDir = vec3.fromValues(0.0,0.0,-4.0);
    this.viewUp = vec3.fromValues(0.0,1.0,0.0);
    this.camera = new Camera(this.viewPoint, this.viewDir, this.viewUp, 1.0);

    pointerSetup(this.gl, this.canvas, this.camera)

    $("#meshUpload").change(function(){
      var selected = $("#selectedMeshes");
      var upload = $("#meshUpload")[0];

      if ('files' in upload){
        if (upload.files.length == 0){
          console.log('no mesh selected');
        } else {
          var mesh = upload.files[0];
          if ('name' in mesh){
            selected.append("<input type='checkbox' name='mesh' value='"+mesh.name+"' checked>"+mesh.name+"<br>")
            var loader = new ResourceLoader(this);
            loader.load3DObj(mesh.name, mesh.name);
          }
        }
      }
    });

    var c = this;
    $('input[type=radio][name=color]').change((function() {
      if (this.value == 'custom'){
        c.bgColor = hexTo01($("#bgColorPicker")[0].value);
      } else {
        c.bgColor = hexTo01(this.value);
      }
    }));

    $('input[type=color][name=color]').change((function() {
      console.log('changed')
      if ($("#custombgcolor").prop("checked")){
        console.log('picked')
        c.bgColor = hexTo01($('input[type=color][name=color]')[0].value);
      }
    }));
  }

  /**
   * Loads all the resources the visualizer needs and gets
   * things started
   * @return a Promise that resolves to the visualizer itself
   */
  init() {

    // functions [0,1] for animating to different things
    const iKickEase = () => this.bandan.getFrequencyValue(22, ease.inCubic)
    // const iHigh = () => this.bandan.getFrequencyValue(18000, ease.outQuart)
    const iKick = () => this.bandan.getFrequencyValue(22)
    const iHigh = () => this.bandan.getFrequencyValue(18000)
    const iTime = () => this.animation_i

    this.lightHigh = () => this.bandan.getFrequencyValue(16000)
    this.lastHigh = 0;
    this.lightMid = () => this.bandan.getFrequencyValue(1000)
    this.lastMid = 0;
    this.lightKick = () => this.bandan.getFrequencyValue(40)
    this.lastKick = 0;
    
    return Promise.resolve(new ResourceLoader(this))
        // audio buffer needs to be loaded to 'audio', also load meshes and textures
        // .then(loader => loader.loadAudio('audio', 'data/songs/vollekraftvoraus.mp3', context))
        .then(loader => loader.loadImage('earthImage', 'earth.png'))
        .then(loader => loader.loadImage('orangeImage', 'orange.png'))
        .then(loader => loader.load3DObj('cube_obj', 'cube.obj'))
        .then(loader => loader.load3DObj('sphere_obj', 'sphere.obj'))
        .then(loader => loader.loadImage('skyboxX0', 'skybox/galaxy+X.png'))
        .then(loader => loader.loadImage('skyboxX1', 'skybox/galaxy-X.png'))
        .then(loader => loader.loadImage('skyboxY0', 'skybox/galaxy+Y.png'))
        .then(loader => loader.loadImage('skyboxY1', 'skybox/galaxy-Y.png'))
        .then(loader => loader.loadImage('skyboxZ0', 'skybox/galaxy+Z.png'))
        .then(loader => loader.loadImage('skyboxZ1', 'skybox/galaxy-Z.png'))
        // things have been loaded 
        .then(_ => {

        meshes.push([this.sphere_obj, this.earthImage]);
        meshes.push([this.cube_obj, this.earthImage]);

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

        var MAX_BG_SPHERES = 4;
        for (var i=0;i<MAX_BG_SPHERES;i++){
          var color = rand_color()
          var mNt = rand_mesh_and_tex();
          const bg_sphere = new AObject(this.gl, mNt[0], mNt[1], color, color)
          bg_sphere.transform(transform.translate(0,0,-8))
          bg_sphere.transform(transform.rotate([0,1,0],2*i/MAX_BG_SPHERES))

          var amt = 2*Math.random()-1;
          bg_sphere.animation = new Animation(bg_sphere, iKick);
          bg_sphere.animation.addSequence([
              anim.translate(0,amt/2,0),
              anim.translate(0,amt/2,0),
              anim.compose([
                  anim.rotateFixed([0,1,0],-2*i/MAX_BG_SPHERES),
                  anim.translateFixed(0,-amt,8),
                  anim.waves(1,2),
                  anim.translateFixed(0,amt,-8),
                  anim.rotateFixed([0,1,0],2*i/MAX_BG_SPHERES),
              ]),
          ])

          this.objects.push(bg_sphere)
        }

        for (var i=0;i<MAX_BG_SPHERES;i++){
          var mNT = rand_mesh_and_tex();
          const spike_sphere = new AObject(this.gl, mNT[0], mNT[1], rand_color(),[1,1,1])
          spike_sphere.transform(transform.translate(0,0,-12))
          spike_sphere.transform(transform.rotate([0,1,0],2*i/MAX_BG_SPHERES+1/MAX_BG_SPHERES))

          spike_sphere.animation = new Animation(spike_sphere, iHigh);
          spike_sphere.animation.addSequence([
              anim.compose([
                  anim.rotateFixed([0,1,0],-2*i/MAX_BG_SPHERES-1/MAX_BG_SPHERES),
                  anim.translateFixed(0,0,12),
                  anim.spikes2(1,16),
                  anim.translate(0,1,0),
                  anim.translateFixed(0,0,-12),
                  anim.rotateFixed([0,1,0],2*i/MAX_BG_SPHERES+1/MAX_BG_SPHERES),
              ]),
          ])

          this.objects.push(spike_sphere)
        }

        for (var i=0;i<2*MAX_BG_SPHERES;i++){
          var mnt = rand_mesh_and_tex();
          const rot_sphere = new AObject(this.gl, mnt[0], mnt[1], [1,1,1],[1,1,1])
          var up = i%2 == 0 ? 5 : -5;
          rot_sphere.transform(transform.translate(0,up,-15))
          rot_sphere.transform(transform.rotate([0,1,0],i/MAX_BG_SPHERES+1/MAX_BG_SPHERES))

          rot_sphere.animation = new Animation(rot_sphere, iKickEase);
          rot_sphere.animation.addSequence([
            anim.rotate([0,1,0],0.4,true),
              // anim.compose([
              //     anim.rotateFixed([0,1,0],-2*i/MAX_BG_SPHERES-1/MAX_BG_SPHERES/2),
              //     anim.translateFixed(0,-up,15),
              //     anim.spikes2(1,16),
              //     anim.translate(0,1,0),
              //     anim.translateFixed(0,up,-15),
              //     anim.rotateFixed([0,1,0],2*i/MAX_BG_SPHERES+1/MAX_BG_SPHERES/2),
              // ]),
          ])

          this.objects.push(rot_sphere)
        }

        const globe = new AObject(this.gl, this.sphere_obj, this.earthImage, [0.3,0.3,0.3],[1,1,1])
        globe.transform(transform.scale(-20))
        //this.objects.push(globe)

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
        
        var gl = this.gl;
        var cubemap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxX0);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxY0);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxZ0);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxX1);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxY1);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, this.skyboxZ1);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        this.skyboxCubemap = cubemap;

      })
      .then(_ => initVisualizer(this))
      .then(_ => requestAnimationFrame(this.draw.bind(this)))
      .then(_ => this) // resolve to the visualizer
      .catch(console.error)
  }

  setAudio(audio) {
    const play = this.isPlaying
    // Stop playback
    if (this.isPlaying) {
      this.source.stop(0)
      this.startOffset = 0
      this.isPlaying = false
      this.startTime = 0
    }
    // load audio
    this.audio = audio
    // play!
    if (play) this.togglePlayback()
  }

  /**
   * Play/pause
   */
  togglePlayback() {
    if (!this.audio) return;
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

  explode(){
    if (this.objects.length < 2){
      return;
    }
    for (var i = 0; i < this.objects.length; i++) {
        if (!this.objects[i].animation) continue;

        this.particles.push(PObject.createFromAObject(this.gl, this.objects[i].animation));
        this.respawn.push(this.objects[i]);
        setTimeout(() => {this.objects.push(this.respawn.pop())}, 5000);
        this.objects.splice(i, 1);
        return;
    };
  }


  /** Update what we see on screen */
  draw(time) {
    this.bandan.update()
    updateVisualizer(this, time)
    requestAnimationFrame(this.draw.bind(this));
  }

}
