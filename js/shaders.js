const ENABLE_TEXTURES = true;
const clientRect = $("#webglCanvas")[0].getBoundingClientRect();
var program;

function initializeWebGL(canvas) {
    var gl = null;
    try {
        gl = canvas.getContext("experimental-webgl")
          || canvas.getContext("webgl")
    } catch (error) { console.error(error) }
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}

function pointerSetup(canvas) {
    // mouse lock stuff
    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock ||
                               document.mozExitPointerLock;

    canvas.onclick = () => canvas.requestPointerLock()


    const rotateCamera = (e) => {
        var xRot = (e.movementX/canvas.width)*2*Math.PI;
        var yRot = (e.movementY/canvas.height)*2*Math.PI;
    }

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
    const shader = gl.createShader(shaderType);
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
    const program = gl.createProgram();
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


function updateVisualizer(viz, time) {

    viz.objects.forEach(object => {
        if (!object.animation) return;
        object.animation.update()
        updateShapeVertices(viz.gl, object.animation.aobject.gl_shape, object.animation.mesh.vertices);
    })

    // Draw sky
    viz.gl.clearColor(0.6, 0.6, 1.0, 0.0);
    viz.gl.clear(viz.gl.COLOR_BUFFER_BIT);

    program = createGlslProgram(viz.gl, "vertexShader", "fragmentShader");
    viz.gl.useProgram(program);

    var perspective = mat4.create();
    mat4.perspective(perspective, 70.0, 800.0 / 600.0, 0.1, 100.0);

    var cameraLoc = mat4.create();
    // mat4.rotate(cameraLoc, cameraLoc, current_t, Y_AXIS);
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(1*current_x-0.5, -1*getEyeHeight(), -1*current_y-0.5));
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(3, -1.5, 6));

    var xf = mat4.create();
    mat4.multiply(xf, perspective, cameraLoc);
    mat4.translate(xf, xf, vec3.fromValues(0.0, 0.0, -4.0))

    for (var i = 0; i < viz.objects.length; i++) {
        if (ENABLE_TEXTURES){
            drawShape(viz.gl, viz.objects[i].gl_shape, program, xf, wallTexture);
        } else {
            drawShape(viz.gl, viz.objects[i].gl_shape, program, xf);
        }
    };

    viz.gl.useProgram(null);
}

/**
 * @return a Promise that resolves once
 * the vizualizer has been initialized
 */
const initVisualizer = (viz) => {
    
    viz.gl.depthFunc(viz.gl.LESS);
    viz.gl.enable(viz.gl.DEPTH_TEST);

    // Bind the texture
    if (ENABLE_TEXTURES){
        // Step 1: Create the texture object.
        wallTexture = viz.gl.createTexture();
        // Step 2: Bind the texture object to the "target" TEXTURE_2D
        viz.gl.bindTexture(viz.gl.TEXTURE_2D, wallTexture);
        // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
        //         so that we don't have to deal with flipping the y-coordinate.
        viz.gl.pixelStorei(viz.gl.UNPACK_FLIP_Y_WEBGL, true);
        // Step 4: Download the image data to the GPU.
        viz.gl.texImage2D(viz.gl.TEXTURE_2D, 0, viz.gl.RGBA, viz.gl.RGBA, viz.gl.UNSIGNED_BYTE, viz.earthImage);
        // Step 5: (Optional) Create a mipmap so that the texture can be anti-aliased.
        viz.gl.generateMipmap(viz.gl.TEXTURE_2D);
        // Step 6: Clean up.  Tell WebGL that we are done with the target.
        viz.gl.bindTexture(viz.gl.TEXTURE_2D, null);
    }

}


