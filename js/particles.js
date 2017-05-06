const MAX_PARTICLES = 1000;
const PARTICLE_SIZE = 0.02;
const UPDATE_AMT = 0.02;

class Particle {
    constructor(radius, center, density, color, duration){
        this.num_particles = Math.floor(MAX_PARTICLES*density);
        // riperoni
        var v = [].concat.apply([], 
                Array.apply(null, {length: this.num_particles})
                .map(_ => [center[0] + PARTICLE_SIZE*Math.random()-PARTICLE_SIZE/2, 
                           center[1] + PARTICLE_SIZE*Math.random()-PARTICLE_SIZE/2, 
                           center[2] + PARTICLE_SIZE*Math.random()-PARTICLE_SIZE/2]));
        this.mesh = {
            vertices : v.slice(),
            // TODO make normals always face user
            normals : Array.apply(null, {length: 3*this.num_particles}).map(_ => Math.random()-0.5),
            lineInd : [],
            uvs : Array.apply(null, {length: 2*this.num_particles}).map(_ => 0),
            triInd : Array.apply(null, {length: this.num_particles}).map((_,i) => i),
            lineColor : color,
            fillColor : color,
        }
        this.remaining = duration;
        this.total = duration;
        this.color = this.mesh.fillColor;
    }

    update(time) {
        this.remaining -= time;
        if (this.remaining < 0){
            return false;
        }
        this.mesh.vertices = ([].concat.apply([], this.mesh.vertices.map((vert, i) => {
            if (i%9 == 0){
                return [vert + this.mesh.normals[i]*UPDATE_AMT, this.mesh.vertices[i+1]+this.mesh.normals[i+1]*UPDATE_AMT, this.mesh.vertices[i+2]+this.mesh.normals[i+2]*UPDATE_AMT,
                    this.mesh.vertices[i+3] + this.mesh.normals[i]*UPDATE_AMT, this.mesh.vertices[i+4]+this.mesh.normals[i+1]*UPDATE_AMT, this.mesh.vertices[i+5]+this.mesh.normals[i+2]*UPDATE_AMT,
                    this.mesh.vertices[i+6] + this.mesh.normals[i]*UPDATE_AMT, this.mesh.vertices[i+7]+this.mesh.normals[i+1]*UPDATE_AMT, this.mesh.vertices[i+8]+this.mesh.normals[i+2]*UPDATE_AMT]
            } else {
                return []
            }
        })));
        var ratio = this.remaining/this.total;
        this.mesh.fillColor = this.color.map(vert => ratio*vert);
        return true;
    }
}

Particle.createParticlesFromMesh = function (data, duration){
    var part = new Particle(1, [0,0,0], 0, [0,0,0], duration)    
    part.num_particles = Math.floor(data.triInd.length/3);
    part.mesh = jQuery.extend(true, {}, data)
    // verts and triinds have to be 1-1 for particles :/
    part.mesh.vertices = ([].concat.apply([], part.mesh.triInd
        .map(v => [part.mesh.vertices[3*v], part.mesh.vertices[3*v+1], part.mesh.vertices[3*v+2]])));
    part.mesh.normals = ([].concat.apply([], part.mesh.triInd
        .map(v => [part.mesh.normals[3*v], part.mesh.normals[3*v+1], part.mesh.normals[3*v+2]])));
    part.mesh.uvs = ([].concat.apply([], part.mesh.triInd
        .map(v => [part.mesh.uvs[3*v], part.mesh.uvs[3*v+1]])));
    part.mesh.triInd = part.mesh.triInd.map((_,i) => i);
    part.mesh.lineInd = [];
    part.color = data.fillColor;

    return part;
}