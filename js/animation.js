const transform = {
  /** Scales an object */
  scale : s => m => Object.assign(m, {
    vertices: m.vertices.map(v => v*s)
  }),

  /** Translates an object */
  translate : (x, y, z) => m => Object.assign(m, {
    vertices: m.vertices.map((v, i) => {
      switch (i%3) {
        case 0: return v + x
        case 1: return v + y
        case 2: return v + z
  }})}),

  rotate : (axis, amt = 1) => m => Object.assign(m, {
    vertices : ([].concat.apply([], m.vertices.map((_, i) => {
        if (i%3 == 0){
          var rot = mat4.create();
          var vert = vec4.fromValues(m.vertices[i], m.vertices[i+1], m.vertices[i+2],1);
          mat4.rotate(rot, rot, (amt*Math.PI), axis);
          vec4.transformMat4(vert, vert, rot);
          return [vert[0], vert[1], vert[2]]
        } else {
          return []
        }
      }))),
    normals : ([].concat.apply([], m.normals.map((_, i) => {
        if (i%3 == 0){
          var rot = mat4.create();
          var vert = vec4.fromValues(m.normals[i], m.normals[i+1], m.normals[i+2],0);
          mat4.rotate(rot, rot, (amt*Math.PI), axis);
          vec4.transformMat4(vert, vert, rot);
          return [vert[0], vert[1], vert[2]]
        } else {
          return []
        }
      }))),
    }),

}

// TODO it will be hard but we need to implement changing normals also in the animations

/*
 * only considering the t value for the range [0, 1] => [0, 1]
 */
const anim = {
  /** animates between an object as scale start, and at scale end */
  scale : (start, end) => function do_scale (m, t) {
    m.vertices = m.vertices.map((vertex) => vertex * (((end - start) * t) + start))
    return m
  },

  /** moves an object m by x,y,z coordinates in t time */
  translate : (x, y, z) => function do_translate (m, t) {
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      switch (i%3) {
        case 0: { m.vertices[i] = m.vertices[i] + (x * t); continue; }
        case 1: { m.vertices[i] = m.vertices[i] + (y * t); continue; }
        case 2: { m.vertices[i] = m.vertices[i] + (z * t); continue; }
      }
    }
    return m
  },

  translateFixed : (x, y, z) => function do_translateFixed (m, t) {
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      switch (i%3) {
        case 0: { m.vertices[i] = m.vertices[i] + x; continue; }
        case 1: { m.vertices[i] = m.vertices[i] + y; continue; }
        case 2: { m.vertices[i] = m.vertices[i] + z; continue; }
      }
    }
    return m
  },
  /** Creates a sequence of animations that run one after the other, in t time */
  seq : (funcs) => function do_seq (m, t) {
    const seq_t = t*funcs.length - 0.0001; // for round off
    const cur_anim_t = seq_t % 1;
    const cur_anim = seq_t - cur_anim_t;
    // apply finished functions
    m = funcs.slice(0, cur_anim).reduce((m, f) => f(m, 1), m)
    // partially apply current anim
    return funcs[cur_anim](m,cur_anim_t);
  },

  // each frame randomly scale vertex.xyz
  waves : (min, max) => function do_waves (m, t) {
    // const amts = Array.apply(null, {length: m.vertices.length})

    // // Populate random amts
    // for (var i = amts.length - 1; i >= 0; i--) {
    //   amts[i] = Math.random(min,max)
    // };

    // apply amts to vertices
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      m.vertices[i] = m.vertices[i] * ((Math.random(min,max)**2 * t) + min)
    }

    return m;
  },

  // random vertices
  spikes : (amts) => function do_spikes (m, t) {
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      m.vertices[i] = m.vertices[i] * ((amts[i]**2 * t) + 1)
    }
    return m;
  },

  // scale every third vertex (works well if faces are defined in a reasonable pattern)
  spikes2 : (min, max) => function do_spikes2 (m, t) {
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      if (Math.floor(i/3) % 3 === 0) {
        m.vertices[i] = m.vertices[i] * (((max - min) * t**2) + min)
      }
    }
    return m
  },

  rotate : (axis, amt = 1, ignorenormals = false) => function do_rotate (m, t) {

    for (var i = 0, len = m.vertices.length; i < len; i++) {
      if (i%3 == 0){
        const rot = mat4.create();
        const vert = vec4.fromValues(m.vertices[i], m.vertices[i+1], m.vertices[i+2],1);
        mat4.rotate(rot, rot, t * (amt*Math.PI), axis);
        vec4.transformMat4(vert, vert, rot);
        m.vertices[i]   = vert[0]
        m.vertices[i+1] = vert[1]
        m.vertices[i+2] = vert[2]
      } else { }
    }

    if (!ignorenormals) {
      for (var i = 0, len = m.normals.length; i < len; i++) {
        if (i%3 == 0){
          const rot = mat4.create();
          const vert = vec4.fromValues(m.normals[i], m.normals[i+1], m.normals[i+2],0);
          mat4.rotate(rot, rot, t * (amt*Math.PI), axis);
          vec4.transformMat4(vert, vert, rot);
          m.normals[i]   = vert[0]
          m.normals[i+1] = vert[1]
          m.normals[i+2] = vert[2]
        } else { }
      }
    }
    return m
  },

  rotateFixed : (axis, amt = 1) => function do_rotateFixed (m, t) {

    // var verts = []
    for (var i = 0, len = m.vertices.length; i < len; i++) {
      if (i%3 == 0){
        const rot = mat4.create();
        const vert = vec4.fromValues(m.vertices[i], m.vertices[i+1], m.vertices[i+2],1);
        mat4.rotate(rot, rot, (amt*Math.PI), axis);
        vec4.transformMat4(vert, vert, rot);
        m.vertices[i]   = vert[0]
        m.vertices[i+1] = vert[1]
        m.vertices[i+2] = vert[2]
      }
    }

    for (var i = 0, len = m.normals.length; i < len; i++) {
      if (i%3 == 0){
        var rot = mat4.create();
        var vert = vec4.fromValues(m.normals[i], m.normals[i+1], m.normals[i+2],0);
        mat4.rotate(rot, rot, (amt*Math.PI), axis);
        vec4.transformMat4(vert, vert, rot);
        m.normals[i]   = vert[0]
        m.normals[i+1] = vert[1]
        m.normals[i+2] = vert[2]
      }
    }

    return m
  },

  /** Creates an animation from multiple concurrent animations */
  compose : (funcs) => function do_compose (m, t) {
    var res = m;
    for (var i = 0, len = funcs.length; i < len; i++) {
      res = funcs[i](res, t)
    }
    return res
  }
}

class Animation {

    /**
     * @param  aobject Object to animate
     * @param  get_i   function returning current animation time: () -> [0,1]
     */
    constructor(aobject, get_i) {
        this.aobject = aobject
        this.get_i = get_i

        // the gl shape object returned by createShape
        this.transformations = [];
        this.sequence_i = 0;
        this.mesh = jQuery.extend(true, {}, this.aobject.original)
    }

    addCompose(funcs) {
        this.transformations.push(anim.compose(funcs))
    }

    addScale(amt){
        this.transformations.push(anim.scale(amt));
    }

    addTranslate(x,y,z){
        this.transformations.push(anim.translate(x,y,z));
    }

    addSequence(sequence){
        this.transformations.push(anim.seq(sequence))
    }

    apply(i){
        this.mesh = jQuery.extend(true, {}, this.aobject.original);
        var self = this;

        this.transformations.forEach(function (elem){
            elem(self.mesh, i);
        });
    }

    _clamp(i){
        if (i > 1.0){
            return 1.0;
        } else if (i<0.0){
            return 0.0;
        } else {
            return i;
        }
    }

    _interpolate(min, max, i){
        return (1-i)*min + i*max;
    }


    resetMesh() {
        // const clone = function (x) { return x }
        // this.mesh = jQuery.extend(true, {}, this.aobject.original); // this is slow
        this.mesh.vertices  = this.aobject.original.vertices.slice(0)
        this.mesh.lineColor = this.aobject.original.lineColor.slice(0)
        this.mesh.fillColor = this.aobject.original.fillColor.slice(0)
    }

    update() {
        this.resetMesh()
        const len = this.transformations.length; // small performance hack
        const i = this.get_i();

        for (var j = 0; j < len; j++) {
          this.transformations[j](this.mesh, i);
        };
    }
}