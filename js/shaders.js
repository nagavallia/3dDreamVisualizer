const ENABLE_TEXTURES = false;
const clientRect = $("#webglCanvas")[0].getBoundingClientRect();

var programs = [];

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

function pointerSetup(gl, canvas, camera) {
    // mouse lock stuff
    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock ||
                               document.mozExitPointerLock;

    canvas.onclick = () => canvas.requestPointerLock()

    const rotateCamera = (e) => {
        //get angles of rotation
        var xRot = -1.0*(e.movementX/canvas.width)*2*Math.PI;
        var yRot = -1.0*(e.movementY/canvas.height)*2*Math.PI;

        //turn angles into quaternions
        var xQuat = quat.create(); var yQuat = quat.create();
        quat.setAxisAngle(xQuat, camera.basisV, xRot); quat.setAxisAngle(yQuat, camera.basisU, yRot);

        //apply quat rotation
        vec3.transformQuat(camera.viewDir, camera.viewDir, xQuat);
        vec3.transformQuat(camera.viewDir, camera.viewDir, yQuat);

        camera.updateBasis();
    }

    const keyboardCamera = (e) => {
        switch (e.key) {
            case 'w':
                var wMove = vec3.clone(camera.basisW); vec3.normalize(wMove, wMove); vec3.negate(wMove, wMove);
                vec3.add(camera.viewPoint, camera.viewPoint, wMove);
                break;
            case 'a':
                var aMove = vec3.clone(camera.basisU); vec3.normalize(aMove, aMove); vec3.negate(aMove, aMove);
                vec3.add(camera.viewPoint, camera.viewPoint, aMove);
                break;
            case 's':
                var sMove = vec3.clone(camera.basisW); vec3.normalize(sMove, sMove);
                vec3.add(camera.viewPoint, camera.viewPoint, sMove);
                break;
            case 'd':
                var dMove = vec3.clone(camera.basisU); vec3.normalize(dMove, dMove); 
                vec3.add(camera.viewPoint, camera.viewPoint, dMove);
                break;
            case 'q':
                var qRot = (1.0/40.0)*2*Math.PI;
                var qQuat = quat.create(); quat.setAxisAngle(qQuat, camera.viewDir, qRot);
                vec3.transformQuat(camera.viewUp, camera.viewUp, qQuat);
                break;
            case 'e':
                var eRot = -1.0*(1.0/40.0)*2*Math.PI;
                var eQuat = quat.create(); quat.setAxisAngle(eQuat, camera.viewDir, eRot);
                vec3.transformQuat(camera.viewUp, camera.viewUp, eQuat);
                break;
            case 'Shift':
                var shiftMove = vec3.clone(camera.basisV); vec3.normalize(shiftMove, shiftMove); vec3.negate(shiftMove, shiftMove);
                vec3.add(camera.viewPoint, camera.viewPoint, shiftMove);
                break;
            case ' ': //space bar pressed
                var spaceMove = vec3.clone(camera.basisV); vec3.normalize(spaceMove, spaceMove); 
                vec3.add(camera.viewPoint, camera.viewPoint, spaceMove);
                break;
        }
        camera.updateBasis();
    }

    const lockChangeAlert = () => {
      if (document.pointerLockElement === canvas ||
          document.mozPointerLockElement === canvas) {
        console.log('The pointer lock status is now locked');
        document.addEventListener("mousemove", rotateCamera, false);
        document.addEventListener("keydown", keyboardCamera, false)
      } else {
        console.log('The pointer lock status is now unlocked');
        document.removeEventListener("mousemove", rotateCamera, false);
        document.removeEventListener("keydown", keyboardCamera, false);
      }
    }

    const fullscreen = () => {
        canvas.height = screen.height;
        canvas.width = screen.width;
        gl.viewport(0, 0, canvas.width, canvas.height);
        if(canvas.webkitRequestFullScreen) {
           canvas.webkitRequestFullScreen();
        } else {
            canvas.mozRequestFullScreen();
        }            
    }

    const exitfullscreen = () => {
        if (!document.webkitIsFullScreen && !document.mozFullScreen){
            canvas.width = 800;
            canvas.height = 600;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }
    
    canvas.addEventListener("click",fullscreen)
    document.addEventListener('webkitfullscreenchange', exitfullscreen, false);
    document.addEventListener('mozfullscreenchange', exitfullscreen, false);
    document.addEventListener("fullscreenchange", exitfullscreen, false );
 
    

    // pointer lock event listeners
    // Hook pointer lock state change events for different browsers
    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

}

function createShape(gl, data) {
    var shape = {};
    
    if (!('normals' in data)) { console.log('AAA', new Float32Array(data.vertices), new Uint16Array(data.triInd)); }
    
    shape.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    shape.triIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.triInd), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    if ('normals' in data) {
        shape.normBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.normBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); }
    
    if ('uvs' in data) {
        shape.uvBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, shape.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.uvs), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null); }
    
    if ('lineInd' in data) {
        shape.lineIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.lineInd), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); 
        shape.lineLen = data.lineInd.length; }    
    
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

function createSkybox(gl, size)
{
    var vertices = []; var indexes = [];

    vertices.push(-size,-size,size, size,-size,size, size,size,size, -size,size,size, -size,-size,-size, size,-size,-size, size,size,-size, -size,size,-size);
    indexes.push(4,0,7, 7,0,3, 0,1,3, 3,1,2, 1,5,2, 2,5,6, 5,4,6, 6,4,7, 0,2,7, 7,2,6, 4,5,0, 0,5,1);

    var data = { vertices: vertices, triInd: indexes }; 
    
    console.log('CREATE SKYBOX',data);
    
    return createShape(gl, data);
}

function drawShape(gl, shape, program, transforms, lights, texture = null)
{    
    const exposure = 1.0; const roughness = 0.10;
    gl.uniform1f(gl.getUniformLocation(program,"exposure"), exposure);  
    gl.uniform1f(gl.getUniformLocation(program,"roughness"), roughness);
        
    gl.uniform3fv(gl.getUniformLocation(program,"lightColors"), lights.colors);  
    gl.uniform3fv(gl.getUniformLocation(program,"lightPositions"), lights.positions);   
    
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normBuffer);
    const normalLocation = gl.getAttribLocation(program, "normal");
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.uvBuffer);
    const texLocation = gl.getAttribLocation(program, "texCoord");
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 4 * 2, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "normalMatrix"), false, transforms.normals);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraMatrix"), false, transforms.camera);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, transforms.projection);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triIndexBuffer);

    const useTexsLocation = gl.getUniformLocation(program, "use_textures");
    gl.uniform1i(useTexsLocation, +ENABLE_TEXTURES);

    if (texture){
        console.log("drawing with texture?");
        if (gl.getUniformLocation(program, "texture") != null) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            const textureLocation = gl.getUniformLocation(program, "texture");
            gl.uniform1i(textureLocation, 0);
        }
    } else {
        const colorLocation = gl.getUniformLocation(program, "color");
        gl.uniform3fv(colorLocation, shape.fillColor)
    }

    gl.drawElements(gl.TRIANGLES, shape.triLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // draw lines on shape last
    if ('lineIndexBuffer' in shape) {
        gl.uniform3fv(gl.getUniformLocation(program, "color"), shape.lineColor);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
        gl.drawElements(gl.LINES, shape.lineLen, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); }
}

var drawn = false;

function drawSkybox(viz, gl, program, transforms)
{
    const exposure = 1.0; gl.uniform1f(gl.getUniformLocation(program,"exposure"), exposure); 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, viz.skyboxShape.vertexBuffer);
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    var cameraMatrix = mat4.create();
    mat4.lookAt(cameraMatrix, vec3.create(), viz.camera.lookPoint, viz.camera.viewUp);    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraMatrix"), false, cameraMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, transforms.projection);
        
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, viz.skyboxCubemap); 
    gl.uniform1i(gl.getUniformLocation(program,'skyboxTexture'), 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, viz.skyboxShape.triIndexBuffer);
    gl.drawElements(gl.TRIANGLES, viz.skyboxShape.triLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    if (!drawn)
    {
        console.log(viz); 
        console.log(gl); 
        console.log(program); 
        console.log(transforms);
        console.log(viz.skyboxShape);
        console.log(viz.skyboxCubemap);
        console.log(cameraMatrix);
        drawn = true;
    }
}

function updateVisualizer(viz, time) {

    for (var i = 0; i < viz.objects.length; i++) {
        let object = viz.objects[i]
        if (!object.animation) continue;
        object.animation.update()
        updateShapeVertices(viz.gl, object.animation.aobject.gl_shape, object.animation.mesh.vertices);
    };

    var program = getProgram(viz,'main','main'); viz.gl.useProgram(program);
    
    var projectionMatrix = mat4.create(); const FOV = 70.0; const NEAR = 0.1; const FAR = 100.0;
    mat4.perspective(projectionMatrix, FOV, viz.canvas.width / viz.canvas.height, NEAR, FAR);

    var cameraMatrix = mat4.create();
    mat4.lookAt(cameraMatrix, viz.camera.viewPoint, viz.camera.lookPoint, viz.camera.viewUp);
    
    var normalMatrix = mat4.create(); mat4.copy(normalMatrix, cameraMatrix); 
    mat4.invert(normalMatrix, normalMatrix); mat4.transpose(normalMatrix, normalMatrix);

    var transforms = { projection: projectionMatrix, camera: cameraMatrix, normals: normalMatrix };
    
    var lights = getLights(viz);

    viz.clearColor = [viz.lightHigh()+0.5, viz.lightHigh()+0.5, viz.lightHigh()+0.5, 0];
    viz.gl.clearColor(...viz.clearColor, 0);
    viz.gl.clear(viz.gl.COLOR_BUFFER_BIT);
    
    for (var i = 0; i < viz.objects.length; i++) {
        drawShape(viz.gl, viz.objects[i].gl_shape, program, transforms, lights,
            ENABLE_TEXTURES ? wallTexture : null);
    };
    
    program = getProgram(viz,'skybox','skybox'); viz.gl.useProgram(program);    
    drawSkybox(viz, viz.gl, program, transforms);        
    viz.gl.useProgram(null);
}

function getLights(viz)
{
    return { 
        positions: [
            0,-1.0,5.0,
            4.0,0.0,3.0,
            -4,0,3,
            0,1,10,
        ], 
        colors: [
            viz.lightHigh()*50,viz.lightHigh()*50,viz.lightHigh()*50,
            viz.lightKick()*20,0,0,
            0,0,viz.lightMid()*20,
            30,30,30,
        ],
    };
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

    const size = 1000; viz.skyboxShape = createSkybox(viz.gl, size);
}

function getProgram(viz, vertName, fragName)
{
    var name = vertName+'_'+fragName;
    if (!(name in programs)) { 
        var program = createProgram(viz, vertName, fragName);
        program.name = name; programs[name] = program;
    }        
    return programs[name];
};

function createProgram(viz, vertName, fragName) 
{        
    var gl = viz.gl; 
    var vertexShaderId = vertName+"_vertex_program";
    var fragmentShaderId = fragName+"_fragment_program";

    var program = gl.createProgram();

    gl.attachShader(program, createShader(viz, vertexShaderId));
    gl.attachShader(program, createShader(viz, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    } else {
        return program;
    }
};

function createShader(viz, shaderScriptId) 
{        
    var gl = viz.gl;

    var shaderScript = $("#"+shaderScriptId);
    var shaderSource = shaderScript[0].text;

    if (shaderScript.data('include')) { shaderSource = $('#'+shaderScript.data('include')).text() + shaderSource; }

    var shaderType = null;
    if (shaderScript[0].type === "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript[0].type === "x-shader/x-fragment") {
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
};
