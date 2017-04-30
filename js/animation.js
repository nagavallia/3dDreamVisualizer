class Animation {
    constructor(mesh, shape) {
        // the triangle mesh object with vertices, triIndices, etc
        this.mesh = mesh
        this.orig = jQuery.extend(true, {}, mesh);
        // the gl shape object returned by createShape
        this.shape = shape
        this.transformations = [];
        this.sequence_i = 0;

        // this scale is weird if the object is not centered..
        // probably want to fix this so that scale behaves similarly
        // at all locations
        this.scale = (s) => (m, t) => {
            m.vertices = m.vertices.map((vertex) => vertex * (s * t))
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
            var seq_t = t*funcs.length - 0.0001; // for round off
            var cur_anim_t = seq_t % 1;
            var cur_anim = seq_t - cur_anim_t;

            // apply finished functions
            for (var i=0; i<cur_anim; i++){
                funcs[i](m,1);
            }

            // partially apply current anim
            return funcs[cur_anim](m,cur_anim_t);
        }
        
    }

    apply(i){
        this.mesh = jQuery.extend(true, {}, this.orig);
        var self = this;

        this.transformations.forEach(function(elem){
            elem(self.mesh, i);
        });
    }

    addScale(amt){
        this.transformations.push(this.scale(amt));
    }

    addTranslate(x,y,z){
        this.transformations.push(this.translate(x,y,z));
    }

    addSequence(types, args){

        var funcs = [];
        for (var i=0; i<types.length; i++){
            switch(types[i]){
                case "translate":
                    funcs.push(this.translate(args[i][0],args[i][1], args[i][2]));
                    break;
                case "scale":
                    funcs.push(this.scale(args[i]));
                    break;
                default:
                    console.error('Unknown animation type in addSequence');
                    break;
            }
        }

        this.transformations.push(this.seq(funcs));
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