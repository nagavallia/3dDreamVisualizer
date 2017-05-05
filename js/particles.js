const MAX_PARTICLES = 1000;
const PARTICLE_SIZE = 0.05;

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
            if (i%3 == 0){
                var j = Math.floor(i/9);
                return [vert + this.mesh.normals[j]*0.01, this.mesh.vertices[i+1]+this.mesh.normals[j+1]*0.01, this.mesh.vertices[i+2]+this.mesh.normals[j+2]*0.01]
            } else {
                return []
            }
        })));
        var ratio = this.remaining/this.total;
        this.mesh.fillColor = this.color.map(vert => ratio*vert);
        return true;
    }
}