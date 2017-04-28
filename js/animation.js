class Animation {
    constructor(mesh, shape) {
        // the triangle mesh object with vertices, triIndices, etc
        this.mesh = mesh
        this.orig = jQuery.extend(true, {}, mesh);
        // the gl shape object returned by createShape
        this.shape = shape
        this.transformations = [];
        
    }

    apply(i){
        this.mesh = jQuery.extend(true, {}, this.orig);
        var self = this;

        this.transformations.forEach(function(elem){
            elem(this.mesh, i);
        });
    }

    addScale(amt){
        this.transformations.push(scale(amt));
    }

    addTranslate(amt){
        this.transformations.push(["translate", amt]);
    }

    const scale = (s) => (m, t) => {
        m.vertices = m.vertices.map((vertex) => vertex * (s * t))
        return m
    }

    const translate = (x, y, z) => (m, t) => {
        m.vertices = m.vertices.map((vertex, i) => { switch (i%3) {
            case 0: return vertex + (x * t)
            case 1: return vertex + (y * t)
            case 2: return vertex + (z * t)
        }})
        return m
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