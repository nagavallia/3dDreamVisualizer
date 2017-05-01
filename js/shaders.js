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
  constructor (raw_mesh) {
    const parsed = K3D.parse.fromOBJ(raw_mesh);
    this.mesh = {
      vertices : parsed.c_verts,
      lineInd : [],
      uvs : parsed.c_uvt,
      triInd : parsed.i_verts,
      lineColor : [0.0, 1.0, 1.0],
      fillColor : [1.0, 0.0, 0.0],
    }
    this.original = jQuery.extend(true, {}, this.mesh);
    this.gl_shape = createShape(gl, this.mesh);
    this.animation = null
  }
}

function initializeWebGL(selector) {

    const canvas = $(selector)[0]

    // mouse lock stuff
    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock ||
                               document.mozExitPointerLock;

    canvas.onclick = () => canvas.requestPointerLock()

    const lockChangeAlert = () => {
      if (document.pointerLockElement === canvas ||
          document.mozPointerLockElement === canvas) {
        console.log('The pointer lock status is now locked');
        document.addEventListener("mousemove", rotateCamera, false);
      } else {
        console.log('The pointer lock status is now unlocked');
        document.removeEventListener("mousemove", rotateCamera, false);
      }
    }

    // pointer lock event listeners
    // Hook pointer lock state change events for different browsers
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

    var gl = null;
    try {
        gl = canvas.getContext("experimental-webgl");
        if (!gl) {
            gl = canvas.getContext("webgl");
        }
    } catch (error) { console.error(error) }
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}

function createShader(gl, shaderScriptId) {
    var shaderScript = $("#" + shaderScriptId);
    var shaderSource = shaderScript[0].text;
    var shaderType = null;
    if (shaderScript[0].type == "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript[0].type == "x-shader/x-fragment") {
        shaderType = gl.FRAGMENT_SHADER;
    } else {
        throw new Error("Invalid shader type: " + shaderScript[0].type)
    }
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("An error occurred compiling the shader: " + infoLog);
    } else {
        return shader;
    }
}

function createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl, vertexShaderId));
    gl.attachShader(program, createShader(gl, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    } else {
        return program;
    }
}

function createShape(gl, data) {
    var shape = {};
    shape.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    shape.lineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.lineInd), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    shape.triIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.triInd), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    shape.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.uvs), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    shape.lineLen = data.lineInd.length;
    shape.triLen = data.triInd.length;
    shape.lineColor = data.lineColor;
    shape.fillColor = data.fillColor;
    return shape;
}

function updateShapeVertices(gl, shape, verts){
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawShape(gl, shape, program, xf, texture = null) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    var positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.uvBuffer);
    var texLocation = gl.getAttribLocation(program, "vert_texCoord");
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 4 * 2, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "toWorld"), false, xf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triIndexBuffer);

    var useTexsLocation = gl.getUniformLocation(program, "use_textures");
    gl.uniform1i(useTexsLocation, +ENABLE_TEXTURES);

    if (ENABLE_TEXTURES){
        if (gl.getUniformLocation(program, "texture") != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            var textureLocation = gl.getUniformLocation(program, "texture");
            gl.uniform1i(textureLocation, 0);
        }
    } else {
        var colorLocation = gl.getUniformLocation(program, "color");
        gl.uniform3fv(colorLocation, shape.fillColor)
    }

    gl.drawElements(gl.TRIANGLES, shape.triLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
    gl.drawElements(gl.LINES, shape.lineLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.useProgram(null);
}

var inc = 0.01;

function updateWebGl(time) {

    // TODO replace with values from music
    animation_i += inc;
    if (animation_i > 1.0){
        inc = -0.01;
    } else if (animation_i < 0.0){
        inc = 0.01;
    }

    objects.forEach(object => {
        if (!object.animation) return;
        object.animation.apply(animation_i)
        updateShapeVertices(gl, object.animation.aobject.gl_shape, object.animation.mesh.vertices);
    })


    // animations.forEach((animation) => {
    //     animation.apply(animation_i);
    //     // TODO might want to update more of the shape buffers, ie color, but
    //     // there is no need to rewrite the index buffers every time since those do not change
    //     updateShapeVertices(gl, animation.aobject.gl_shape, animation.mesh.vertices);
    // });

    // Draw sky
    gl.clearColor(0.6, 0.6, 1.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    var perspective = mat4.create();
    mat4.perspective(perspective, 70.0, 800.0 / 600.0, 0.1, 100.0);

    var cameraLoc = mat4.create();
    // mat4.rotate(cameraLoc, cameraLoc, current_t, Y_AXIS);
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(1*current_x-0.5, -1*getEyeHeight(), -1*current_y-0.5));
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(3, -1.5, 6));

    var xf = mat4.create();
    mat4.multiply(xf, perspective, cameraLoc);
    mat4.translate(xf, xf, vec3.fromValues(0.0, 0.0, -4.0))

    for (var i = 0; i < objects.length; i++) {
        if (ENABLE_TEXTURES){
            drawShape(gl, objects[i].gl_shape, program, xf, wallTexture);
        } else {
            drawShape(gl, objects[i].gl_shape, program, xf);
        }
    };

    gl.useProgram(null);
    window.requestAnimationFrame(updateWebGl);
}

const ENABLE_TEXTURES = true;
const gl = initializeWebGL("#webglCanvas");
const program = createGlslProgram(gl, "vertexShader", "fragmentShader");
const objects = []

let animation_i = 0.0;

//initialize camera
const viewPoint = vec3.fromValues(0.0,0.0,1.0);
const viewDir = vec3.fromValues(0.0,0.0,-1.0);
const viewUp = vec3.fromValues(0.0,1.0,0.0);
const camera = new Camera(viewPoint, viewDir, viewUp, 1.0);

var clientRect = $("#webglCanvas")[0].getBoundingClientRect();

function rotateCamera(e) {
    var xRot = (e.movementX/canvas.width)*2*Math.PI;
    var yRot = (e.movementY/canvas.height)*2*Math.PI;
}



function runWebGL(){

    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);

    if (ENABLE_TEXTURES){
        // Step 1: Create the texture object.
        wallTexture = gl.createTexture();
        // Step 2: Bind the texture object to the "target" TEXTURE_2D
        gl.bindTexture(gl.TEXTURE_2D, wallTexture);
        // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
        //         so that we don't have to deal with flipping the y-coordinate.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Step 4: Download the image data to the GPU.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, earthImage);
        // Step 5: (Optional) Create a mipmap so that the texture can be anti-aliased.
        gl.generateMipmap(gl.TEXTURE_2D);
        // Step 6: Clean up.  Tell WebGL that we are done with the target.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    requestOBJFile('sphere.obj')
        .then(response => {
            
            sphere = new AObject(response)

            // TODO remove this at some point
            sphere.animation = new Animation(sphere);
            anim = sphere.animation
            anim.addSequence([
                anim.translate(1,0,0),
                anim.compose([
                    anim.translate(-1,0,0),
                    anim.scale(1,2),
                    anim.translate(1, 0, 1)
                ])
            ])

            // anim.addSequence([
            //     anim.translate(1,0,0),
            //     anim.translate(0,1,0),
            //     anim.translate(-2,0,0),
            //     anim.translate(0,-2,0),
            //     anim.translate(2,0,0),
            //     anim.translate(0,2,0)
            // ])

            // animations.push(anim);
            objects.push(sphere)

            window.requestAnimationFrame(updateWebGl);

    })
        .catch(err => console.error(err))

}

if (ENABLE_TEXTURES){
    var earthImage =  new Image();
    earthImage.onload = function() {
        runWebGL();
    };
    earthImage.src = "data/earth.png";
} else {
    runWebGL();
}



