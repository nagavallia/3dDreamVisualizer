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

        // this scale is weird if the object is not centered..
        // probably want to fix this so that scale behaves similarly
        // at all locations
        
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

    update() {
        this.mesh = jQuery.extend(true, {}, this.aobject.original); // this is slow
        const len = this.transformations.length; // small performance hack
        for (let i = 0; i < len; i++) {
          this.transformations[i](this.mesh, this.get_i());
        };
    }
}