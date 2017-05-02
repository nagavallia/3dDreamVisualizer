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

}

/*
 * only considering the t value for the range [0, 1] => [0, 1]
 */
const anim = {
  /** animates between an object as scale start, and at scale end */
  scale : (start, end) => (m, t) => {
    m.vertices = m.vertices.map((vertex) => vertex * (((end - start) * t) + start))
    return m
  },

  /** moves an object m by x,y,z coordinates in t time */
  translate : (x, y, z) => (m, t) => {
    m.vertices = m.vertices.map((vertex, i) => { switch (i%3) {
      case 0: return vertex + (x * t)
      case 1: return vertex + (y * t)
      case 2: return vertex + (z * t)
    }})
    return m
  },

  /** Creates a sequence of animations that run one after the other, in t time */
  seq : (funcs) => (m, t) => {
    const seq_t = t*funcs.length - 0.0001; // for round off
    const cur_anim_t = seq_t % 1;
    const cur_anim = seq_t - cur_anim_t;
    // apply finished functions
    m = funcs.slice(0, cur_anim).reduce((m, f) => f(m, 1), m)
    // partially apply current anim
    return funcs[cur_anim](m,cur_anim_t);
  },

  waves : (min, max) => (m, t) => {
    const amts = Array.apply(null, {length: m.vertices.length}).map(_ => Math.random(min,max));
    m.vertices = m.vertices.map((vertex, i) => vertex * ((amts[i]**2 * t) + min));
    return m;
  },

  // random
  spikes : (amts) => (m, t) => {
    m.vertices = m.vertices.map((vertex, i) => vertex * ((amts[i]**2 * t) + 1));
    return m;
  },

  spikes2 : (min, max) => (m, t) => {
    m.vertices = m.vertices.map((vertex, i) => { switch (Math.floor(i/3) % 3) {
      case 0: return vertex * (((max - min) * t**2) + min)
      case 1: return vertex
      case 2: return vertex
    }})
    return m
  },

  rotate : (axis, amt = 1) => (m, t) => {
    m.vertices = ([].concat.apply([], m.vertices.map((_, i) => {
        if (i%3 == 0){
          var rot = mat4.create();
          var vert = vec4.fromValues(m.vertices[i], m.vertices[i+1], m.vertices[i+2],1);
          mat4.rotate(rot, rot, t * (amt*Math.PI), axis);
          vec4.transformMat4(vert, vert, rot);
          return [vert[0], vert[1], vert[2]]
        } else {
          return []
        }
      })))
    return m
  },

  /** Creates an animation from multiple concurrent animations */
  compose : (funcs) => (m, t) => funcs.reduce((m, f) => f(m, t), m)
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
        const clone = function (x) { return x }
        // this.mesh = jQuery.extend(true, {}, this.aobject.original); // this is slow
        this.mesh.vertices  = this.aobject.original.vertices.map(clone)
        this.mesh.lineColor = this.aobject.original.lineColor.map(clone)
        this.mesh.fillColor = this.aobject.original.fillColor.map(clone)
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