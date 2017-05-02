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
  constructor (gl, raw_mesh, textureImg, color = [1.0, 0.0, 0.0], lColor = [0,0,0]) {
    const parsed = K3D.parse.fromOBJ(raw_mesh);
    this.mesh = {
      vertices : parsed.c_verts,
      lineInd : ([].concat.apply([], parsed.i_verts.map((vert, i) => { switch(i % 3){
        case 0: 
        case 1: return [vert, parsed.i_verts[i+1]]
        case 2: return [vert, parsed.i_verts[i-2]]
      }}))),
      uvs : parsed.c_uvt,
      triInd : parsed.i_verts,
      lineColor : lColor,
      fillColor : color,
    }
    this.original = jQuery.extend(true, {}, this.mesh);
    this.gl_shape = createShape(gl, this.mesh);
    this.animation = null
    this.texture = textureImg
  }
}
