function initializeWebGL(canvas) {
        var gl = null;
        try {
            gl = canvas.getContext("experimental-webgl");
            if (!gl) {
                gl = canvas.getContext("webgl");
            }
        } catch (error) {
            // ehh
        }
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

function drawShape(gl, shape, program, xf, texture) {
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

    if (gl.getUniformLocation(program, "texture") != null) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        var textureLocation = gl.getUniformLocation(program, "texture");
        gl.uniform1i(textureLocation, 0);
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


function updateWebGl(time) {
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
    drawShape(gl, sphere, program, xf, wallTexture);

    gl.useProgram(null);
    window.requestAnimationFrame(updateWebGl);
}



var canvas = $("#webglCanvas")[0]
var gl = initializeWebGL(canvas);
var program = createGlslProgram(gl, "vertexShader", "fragmentShader");
var sphere;

function runWebGL(){

    gl.depthFunc(gl.LESS);
    gl.enable(gl.DEPTH_TEST);

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

    requestOBJFile('sphere.obj')
        .then(response => {

            var parsed = K3D.parse.fromOBJ(response);
            var mesh = {};
            mesh.vertices = parsed.c_verts;
            mesh.lineInd = [];
            mesh.uvs = parsed.c_uvt;
            mesh.triInd = parsed.i_verts;
            mesh.lineColor = [0.0, 1.0, 1.0];
            mesh.fillColor = [1.0, 0.0, 0.0];

            sphere = createShape(gl, mesh);

            window.requestAnimationFrame(updateWebGl);

    })
        .catch(err => console.error(err))

}

var earthImage =  new Image();
earthImage.onload = function() {
    runWebGL();
};
earthImage.src = "data/earth.png";
