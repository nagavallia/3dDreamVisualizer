

class Camera {
  constructor(viewPoint, viewDir, viewUp, projD) {
      this.viewPoint = viewPoint;
      this.viewDir = viewDir;
      this.viewUp = viewUp;
      this.projD = projD;
      this.viewWidth = 1.0;
      this.viewHeight = 1.0;
      this.orbitMode = false;

      this.lookPoint = vec3.create();

      this.basisW = vec3.create(); this.basisU = vec3.create(); this.basisV = vec3.create();

      this.updateBasis();
  }

  updateBasis() {
      vec3.add(this.lookPoint, this.viewPoint, this.viewDir);

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
    this.gl = gl;
    this.mesh = {
      vertices : parsed.c_verts,
      normals : parsed.c_norms,
      lineInd : ([].concat.apply([], parsed.i_verts.map((vert, i) => { switch(i % 3){
        case 0: 
        case 1: return [vert, parsed.i_verts[i+1]]
        case 2: return [vert, parsed.i_verts[i-2]]
      }}))),
      uvs : parsed.c_uvt,
      triInd : parsed.i_verts,
      //normInd : parsed.i_norms,
      lineColor : lColor,
      fillColor : color,
    }
    this.original = jQuery.extend(true, {}, this.mesh);
    this.gl_shape = createShape(gl, this.mesh);
    this.animation = null
  }

  /**
   * Mutably transforms this object's mesh with a transformation function
   */
  transform (func) { 
    func(this.mesh); 
    this.original = jQuery.extend(true, {}, this.mesh);  
    updateShapeVertices(this.gl, this.gl_shape, this.mesh.vertices);
    updateShapeNormals(this.gl, this.gl_shape, this.mesh.normals);
  }
}

class PObject {
  constructor(gl, radius, center, density, color, duration){
    this.particle = new Particle(radius, center, density, color, duration);
    this.gl_shape = createShape(gl, this.particle.mesh);
  }

  update(time){
    return this.particle.update(time);
  }
}

PObject.createFromAObject = function(gl, aobj){
  var pobj = new PObject(gl, 0,0,0,0,0);
  pobj.particle = Particle.createParticlesFromMesh(aobj.mesh, 10000000);
  pobj.gl_shape = createShape(gl, pobj.particle.mesh);

  return pobj;
}
