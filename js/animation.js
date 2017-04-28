class Animation {
    constructor(mesh, shape, type, par) {
        // the triangle mesh object with vertices, triIndices, etc
        this.mesh = mesh
        // the gl shape object returned by createShape
        this.shape = shape
        this.type = type
        this.par = par

        switch (this.type){
            case "scale":
                this.apply = this.scale
                this.min_verts = this.mesh.vertices
                this.max_verts = this.mesh.vertices.map(function(v){
                    return v*par;
                });
                break;
            default:
                console.log("Unknown animation type")
                return;
        }
    }

    scale(i){
        i = this._clamp(i);

        mesh.vertices = [];
        for (var j=0; j<this.min_verts.length; j++){
            mesh.vertices.push(this._interpolate(this.min_verts[j], this.max_verts[j], i));
        }

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