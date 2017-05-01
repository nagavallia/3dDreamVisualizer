class Animation {
    constructor(aobject) {
        this.aobject = aobject
        
        // the gl shape object returned by createShape
        this.transformations = [];
        this.sequence_i = 0;

        // this scale is weird if the object is not centered..
        // probably want to fix this so that scale behaves similarly
        // at all locations
        this.scale = (start, end) => (m, t) => {
            m.vertices = m.vertices.map((vertex) => vertex * (((end - start) * t) + start))
            return m
        }

        this.translate = (x, y, z) => (m, t) => {
            m.vertices = m.vertices.map((vertex, i) => { switch (i%3) {
                case 0: return vertex + (x * t)
                case 1: return vertex + (y * t)
                case 2: return vertex + (z * t)
            }})
            return m
        }

        this.seq = (funcs) => (m, t) => {
            const seq_t = t*funcs.length - 0.0001; // for round off
            const cur_anim_t = seq_t % 1;
            const cur_anim = seq_t - cur_anim_t;

            // console.log(cur_anim, t, funcs)


            // // apply finished functions
            // for (var i=0; i<cur_anim; i++){
            //     funcs[i](m,1);
            // }

            m = funcs.slice(0, cur_anim).reduce((m, f) => f(m, 1), m)

            // partially apply current anim
            return funcs[cur_anim](m,cur_anim_t);
        }

        this.compose = (funcs) => (m, t) => {
            return funcs.reduce((m, f) => f(m, t), m)
        }
        
    }

    addCompose(funcs) {
        this.transformations.push(this.compose(funcs))
    }

    apply(i){
        this.mesh = jQuery.extend(true, {}, this.aobject.original);
        var self = this;

        this.transformations.forEach(function (elem){
            elem(self.mesh, i);
        });
    }

    addScale(amt){
        this.transformations.push(this.scale(amt));
    }

    addTranslate(x,y,z){
        this.transformations.push(this.translate(x,y,z));
    }

    addSequence(sequence){
        this.transformations.push(this.seq(sequence))
    }

    spikey(i){

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
}