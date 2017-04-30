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

function initializeWebGL(canvas) {
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


function requestOBJFile(filename){ return new Promise((res, rej) => {

    const request = new XMLHttpRequest();
    request.open("GET", "data/"+filename, true);
    request.responseType = "arraybuffer";
    request.onerror = () => rej("XHR error or something");

    request.onload = () => { res(request.response)};
    request.send();
})}

var inc = 0.01;
function updateWebGl(time) {

    // TODO replace with values from music
    animation_i += inc;
    if (animation_i > 1.0){
        inc = -0.01;
    } else if (animation_i < 0.0){
        inc = 0.01;
    }    

    animations.forEach(function(elem){
        elem.apply(animation_i);
        // TODO might want to update more of the shape buffers, ie color, but 
        // there is no need to rewrite the index buffers every time since those do not change
        updateShapeVertices(gl, elem.shape, elem.mesh.vertices);
    });

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
    if (ENABLE_TEXTURES){
        drawShape(gl, sphere, program, xf, wallTexture);    
    } else {
        drawShape(gl, sphere, program, xf);
    }
    

    gl.useProgram(null);
    window.requestAnimationFrame(updateWebGl);
}



var canvas = $("#webglCanvas")[0]
var gl = initializeWebGL(canvas);
var program = createGlslProgram(gl, "vertexShader", "fragmentShader");
var sphere;

//initialize camera
var viewPoint = vec3.fromValues(0.0,0.0,1.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var viewUp = vec3.fromValues(0.0,1.0,0.0);
var camera = new Camera(viewPoint, viewDir, viewUp, 1.0);

//mouse lock stuff
// pointer lock object forking for cross browser

canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock ||
                           document.mozExitPointerLock;

canvas.onclick = function() {
  canvas.requestPointerLock();
};

// pointer lock event listeners

// Hook pointer lock state change events for different browsers
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

function lockChangeAlert() {
  if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) {
    console.log('The pointer lock status is now locked');
    document.addEventListener("mousemove", rotateCamera, false);
  } else {
    console.log('The pointer lock status is now unlocked');  
    document.removeEventListener("mousemove", rotateCamera, false);
  }
}

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

            var parsed = K3D.parse.fromOBJ(response);
            mesh.vertices = parsed.c_verts;
            mesh.lineInd = [];
            mesh.uvs = parsed.c_uvt;
            mesh.triInd = parsed.i_verts;
            mesh.lineColor = [0.0, 1.0, 1.0];
            mesh.fillColor = [1.0, 0.0, 0.0];

            sphere = createShape(gl, mesh);
            // TODO remove this at some point
            var anim = new Animation(mesh, sphere);
            anim.addScale(1.4);
            anim.addSequence(['translate', 'translate','translate', 'translate', 'translate','translate'],
                [[1, 0, 0], [0,1,0], [-2,0,0],[0,-2,0], [2,0,0],[0,2,0]]);
            // anim.addTranslate(0.0,2.0,0.0);
            animations.push(anim);

            window.requestAnimationFrame(updateWebGl);

    })
        .catch(err => console.error(err))

}

var ENABLE_TEXTURES = true;

var animations = [];
var animation_i = 0.0;
var mesh = {};

if (ENABLE_TEXTURES){
    var earthImage =  new Image();
    earthImage.onload = function() {
        runWebGL();
    };
    earthImage.src = "data/earth.png";
} else {
    runWebGL();
}
