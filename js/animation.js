class Animation {
    constructor(mesh, shape) {
        // the triangle mesh object with vertices, triIndices, etc
        this.mesh = mesh
        this.orig = jQuery.extend(true, {}, mesh);
        // the gl shape object returned by createShape
        this.shape = shape
        this.transformations = [];

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