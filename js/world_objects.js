

class Camera {
  constructor(viewPoint, viewDir, viewUp, projD) {
      this.viewPoint = viewPoint;
      this.viewDir = viewDir;
      this.viewUp = viewUp;
      this.projD = projD;
      this.viewWidth = 1.0;
      this.viewHeight = 1.0;

      //create w basis vector
      this.basisW = vec3.clone(this.viewDir);
      vec3.normalize(this.basisW,vec3.negate(this.basisW, this.basisW));

      //create u basis vector
      this.basisU = vec3.clone(this.viewUp);
      vec3.normalize(this.basisU, vec3.cross(this.basisU, this.basisU, this.basisW));

      //create v basis vector
      this.basisV = vec3.clone(this.basisW);
      vec3.normalize(this.basisV, vec3.cross(this.basisV, this.basisW, this.basisU));
  }
}

class AObject {
  constructor (gl, raw_mesh, color = {}) {
    this.texture = color.texture || null
    const parsed = K3D.parse.fromOBJ(raw_mesh);
    this.mesh = {
      vertices : parsed.c_verts,
      lineInd : [],
      uvs : parsed.c_uvt,
      triInd : parsed.i_verts,
      lineColor : color.lineColor || [0.0, 1.0, 1.0],
      fillColor : color.fillColor || [1.0, 0.0, 0.0],
    }
    this.original = jQuery.extend(true, {}, this.mesh);
    this.gl_shape = createShape(gl, this.mesh);
    this.animation = null
  }

  /**
   * Mutably transforms this object's mesh with a transformation function
   */
  transform (func) { func(this.mesh); this.original = jQuery.extend(true, {}, this.mesh); }
}
