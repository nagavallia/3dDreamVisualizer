

class Camera {
  constructor(viewPoint, viewDir, viewUp, projD) {
      this.viewPoint = viewPoint;
      this.viewDir = viewDir;
      vec3.normalize(this.viewDir,this.viewDir);
      this.viewUp = viewUp;
      vec3.normalize(this.viewUp, this.viewUp);
      this.projD = projD;
      this.viewWidth = 1.0;
      this.viewHeight = 1.0;
      this.orbitMode = false;

      this.moving = false;
      this.frameCount = 0;
      this.MAX_FRAMES = 10;
      this.moveTrans = mat4.create();

      this.lookPoint = vec3.create();

      this.basisW = vec3.create(); this.basisU = vec3.create(); this.basisV = vec3.create();

      vec3.add(this.lookPoint, this.viewPoint, this.viewDir);

      this.worldToCamera = mat4.create();
      this.cameraToWorld = mat4.create();
      this.normalToCamera = mat4.create();
      mat4.lookAt(this.worldToCamera, this.viewPoint, this.lookPoint, this.viewUp);
      mat4.invert(this.cameraToWorld, this.worldToCamera);
      mat4.transpose(this.normalToCamera, this.cameraToWorld);

      this.updateVectors();

      this.vel_x = 0
      this.vel_y = 0
      this.vel_z = 0
      this.vel_rot_z = 0

      // this.updateBasis();
  }

  updatePosition() {
    var wMove = vec3.fromValues(this.vel_x, this.vel_y, this.vel_z);
    vec3.scale(wMove, wMove, 1/this.MAX_FRAMES);
    mat4.fromTranslation(this.moveTrans, wMove);
    this.moving = true;
  }

   updateVectors() {
  //   vec3.add(this.lookPoint, this.viewPoint, this.viewDir);

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

  updateBasis() {
    vec3.transformMat4(this.viewPoint, vec3.create(), this.cameraToWorld);

    var dir = vec4.fromValues(0,0,-1,0); var up = vec4.fromValues(0,1,0,0);
    vec4.transformMat4(dir, dir,this.cameraToWorld); vec4.transformMat4(up, up,this.cameraToWorld);

    this.viewDir = vec3.fromValues(dir[0],dir[1],dir[2]);
    this.viewUp = vec3.fromValues(up[0],up[1],up[2]);
    vec3.normalize(this.viewDir, this.viewDir); vec3.normalize(this.viewUp, this.viewUp);

    mat4.invert(this.worldToCamera, this.cameraToWorld);
    mat4.transpose(this.normalToCamera, this.cameraToWorld);

    vec3.add(this.lookPoint, this.viewPoint, this.viewDir);

    this.updateVectors();
  }

  relocate(viewPoint, viewDir, viewUp, projD) {
      this.viewPoint = viewPoint;
      this.viewDir = viewDir;
      vec3.normalize(this.viewDir, this.viewDir);
      this.viewUp = viewUp;
      vec3.normalize(this.viewUp, this.viewUp);
      this.projD = projD;
      
      vec3.add(this.lookPoint, this.viewPoint, this.viewDir);

      mat4.lookAt(this.worldToCamera, this.viewPoint, this.lookPoint, this.viewUp);
      mat4.invert(this.cameraToWorld, this.worldToCamera);
      mat4.transpose(this.normalToCamera, this.cameraToWorld);

      this.updateVectors();

      // this.updateBasis();
  }
}

// class Mesh {
//   constructor(vertices, normals, lineInd, uvs, triInd, lineColor, fillColor) {
//     this.vertices  = vertices
//     this.normals   = normals
//     this.lineInd   = lineInd
//     this.uvs       = uvs
//     this.triInd    = triInd
//     this.lineColor = lineColor
//     this.fillColor = fillColor
//   }
// }

class AObject {
  constructor (gl, raw_mesh, textureImg, color = [1.0, 0.0, 0.0], lColor = [0,0,0]) {
    const parsed = K3D.parse.fromOBJ(raw_mesh);
    this.gl = gl;
    this.mesh = {
      vertices: parsed.c_verts,
      normals : parsed.c_norms,
      vertices : parsed.c_verts,
      normalsTemp : ([].concat.apply([], parsed.i_norms.map( index => {
        return [parsed.c_norms[3*index], parsed.c_norms[3*index+1], parsed.c_norms[3*index+2]]
      }))),
      lineInd : ([].concat.apply([], parsed.i_verts.map((vert, i) => { switch(i % 3){
        case 0: 
        case 1: return [vert, parsed.i_verts[i+1]]
        case 2: return [vert, parsed.i_verts[i-2]]
      }}))),
       uvsTemp : ([].concat.apply([], parsed.i_uvt.map( index => {
         return [parsed.c_uvt[2*index], 1.0 - parsed.c_uvt[2*index+1]]
       }))),
      triInd : parsed.i_verts,
      lineColor : lColor,
      fillColor : color,
    }
    this.mesh.uvs = new Array(this.mesh.uvsTemp.length);
    var i = 0;
    parsed.i_verts.forEach(index => {
      this.mesh.uvs[2*index] = this.mesh.uvsTemp[2*i];
      this.mesh.uvs[2*index+1] = this.mesh.uvsTemp[2*i+1]
      i++;
    });
    this.mesh.normals = new Array(this.mesh.normalsTemp.length);
    var j = 0;
    parsed.i_verts.forEach(index => {
      this.mesh.normals[3*index] = this.mesh.normalsTemp[3*j];
      this.mesh.normals[3*index+1] = this.mesh.normalsTemp[3*j+1];
      this.mesh.normals[3*index+2] = this.mesh.normalsTemp[3*j+2];
      j++;
    });
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
