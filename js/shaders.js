const ENABLE_TEXTURES = true;
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
        var sens = $("#lookSlider").slider("value");
        var invertVertVal = invertVert ? 1.0 : -1.0;
        var invertHorizVal = invertHoriz ? 1.0 : -1.0;

        //get angles of rotation
        var yRot = invertHorizVal*(sens/50)*(e.movementX/canvas.width)*2*Math.PI;
        var xRot = invertVertVal*(sens/50)*(e.movementY/canvas.height)*2*Math.PI;

        var mRotX = mat4.create(); var mRotY = mat4.create();
        mat4.fromXRotation(mRotX, xRot); mat4.fromYRotation(mRotY, yRot);

        var R = mat4.create(); mat4.multiply(R, mRotY, mRotX);

        if (camera.orbitMode) {
            var v = vec3.create(); vec3.transformMat4(v, v, camera.worldToCamera);
            var L = mat4.create(); mat4.fromTranslation(L, vec3.negate(vec3.create(),v));
            var LInv = mat4.create(); mat4.fromTranslation(LInv, v);

            mat4.multiply(R, R, L);
            mat4.multiply(R, LInv, R);
            mat4.multiply(camera.cameraToWorld, camera.cameraToWorld, R);
        }
        else {
            mat4.multiply(camera.cameraToWorld, camera.cameraToWorld, R);
        }

        camera.updateBasis();
    }

    const keyboardCamera = (e) => {
        switch (e.key) {
            case 'w':
                if (!camera.moving) {
                    var wMove = vec3.fromValues(0,0,-1);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case 'a':
                if (!camera.moving) {
                    var wMove = vec3.fromValues(-1,0,0);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case 's':
                if (!camera.moving) {
                    var wMove = vec3.fromValues(0,0,1);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case 'd':
                if (!camera.moving) {
                    var wMove = vec3.fromValues(1,0,0);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case 'q':
                if (!camera.moving) {
                    var qRot = (1.0/40.0)*2*Math.PI;
                    qRot *= 1/camera.MAX_FRAMES; 
                    var mRotZ = mat4.create(); mat4.fromZRotation(mRotZ, qRot);
                    if (camera.orbitMode) {
                        var v = vec3.create(); vec3.transformMat4(v, v, camera.worldToCamera);
                        var L = mat4.create(); mat4.fromTranslation(L, vec3.negate(vec3.create(),v));
                        var LInv = mat4.create(); mat4.fromTranslation(LInv, v);
            
                        mat4.multiply(mRotZ, mRotZ, L);
                        mat4.multiply(mRotZ, LInv, mRotZ);
                    }
                    camera.moveTrans = mRotZ;
                    camera.moving = true;
                }
                    break;
            case 'e':
                if (!camera.moving) {
                    var qRot = -1.0*(1.0/40.0)*2*Math.PI;
                    qRot *= 1/camera.MAX_FRAMES; 
                    var mRotZ = mat4.create(); mat4.fromZRotation(mRotZ, qRot);
                    if (camera.orbitMode) {
                        var v = vec3.create(); vec3.transformMat4(v, v, camera.worldToCamera);
                        var L = mat4.create(); mat4.fromTranslation(L, vec3.negate(vec3.create(),v));
                        var LInv = mat4.create(); mat4.fromTranslation(LInv, v);
            
                        mat4.multiply(mRotZ, mRotZ, L);
                        mat4.multiply(mRotZ, LInv, mRotZ);
                    }
                    camera.moveTrans = mRotZ;
                    camera.moving = true;
                }
                    break;
            case 'Shift':
                e.preventDefault();
                if (!camera.moving) {
                    var wMove = vec3.fromValues(0,-1,0);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case ' ': //space bar pressed
                e.preventDefault();
                if (!camera.moving) {
                    var wMove = vec3.fromValues(0,1,0);
                    vec3.scale(wMove, wMove, 1/camera.MAX_FRAMES);
                    mat4.fromTranslation(camera.moveTrans, wMove);
                    camera.moving = true;
                }
                break;
            case 'f':
                camera.orbitMode = !camera.orbitMode;
                console.log(camera.orbitMode);
                break;
            case '1':
                var viewPoint = vec3.fromValues(0.0,0.0,4.0);
                var viewDir = vec3.fromValues(0.0,0.0,-4.0);
                var viewUp = vec3.fromValues(0.0,1.0,0.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '2':
                var viewPoint = vec3.fromValues(0.0,0.0,-4.0);
                var viewDir = vec3.fromValues(0.0,0.0,4.0);
                var viewUp = vec3.fromValues(0.0,1.0,0.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '3':
                var viewPoint = vec3.fromValues(4.0,0.0,0.0);
                var viewDir = vec3.fromValues(-4.0,0.0,0.0);
                var viewUp = vec3.fromValues(0.0,1.0,0.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '4':
                var viewPoint = vec3.fromValues(-4.0,0.0,0.0);
                var viewDir = vec3.fromValues(4.0,0.0,0.0);
                var viewUp = vec3.fromValues(0.0,1.0,0.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '5':
                var viewPoint = vec3.fromValues(0.0,4.0,0.0);
                var viewDir = vec3.fromValues(0.0,-4.0,0.0);
                var viewUp = vec3.fromValues(0.0,0.0,1.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '6':
                var viewPoint = vec3.fromValues(0.0,-4.0,0.0);
                var viewDir = vec3.fromValues(0.0,4.0,0.0);
                var viewUp = vec3.fromValues(0.0,0.0,1.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break; 
            case '7':
                var viewPoint = vec3.fromValues(11/1.3,15/1.3,16/1.3);
                var viewDir = vec3.fromValues(-1.7,-2.56,-2.56);
                var viewUp = vec3.fromValues(0.0,0.0,1.0);

                camera.relocate(viewPoint, viewDir, viewUp, 1.0);
                break;
        }
        camera.updateBasis();
    }
    
    document.addEventListener("keydown", keyboardCamera, false);

    const lockChangeAlert = () => {
      if (document.pointerLockElement === canvas ||
          document.mozPointerLockElement === canvas) {
        console.log('The pointer lock status is now locked');
        document.addEventListener("mousemove", rotateCamera, false);
        //document.addEventListener("keydown", keyboardCamera, false)
      } else {
        console.log('The pointer lock status is now unlocked');
        document.removeEventListener("mousemove", rotateCamera, false);
        //document.removeEventListener("keydown", keyboardCamera, false);
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
            canvas.width = 1280;
            canvas.height = 720;
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

function createSkybox(gl, size)
{
    var vertices = []; var indexes = [];

    vertices.push(-size,-size,size, size,-size,size, size,size,size, -size,size,size, -size,-size,-size, size,-size,-size, size,size,-size, -size,size,-size);
    indexes.push(4,0,7, 7,0,3, 0,1,3, 3,1,2, 1,5,2, 2,5,6, 5,4,6, 6,4,7, 0,2,7, 7,2,6, 4,5,0, 0,5,1);

    var data = { vertices: vertices, triInd: indexes }; 
    
    return createShape(gl, data);
}

function updateShapeVertices(gl, shape, verts){
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function updateShapeNormals(gl, shape, normals){
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function updateShapeFillColor(shape, color){
    shape.fillColor = color;
}

function drawShape(gl, shape, program, transforms, lights, texture = null, particles = false) 
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

    const particleLocation = gl.getUniformLocation(program, "particle");
    gl.uniform1i(particleLocation, +particles);

    if (ENABLE_TEXTURES && texture){
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

    if ('lineIndexBuffer' in shape) {
        gl.uniform3fv(gl.getUniformLocation(program, "color"), shape.lineColor);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
        gl.drawElements(gl.LINES, shape.lineLen, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); }
}

function drawSkybox(viz, gl, program, transforms, exposure)
{
    gl.uniform1f(gl.getUniformLocation(program,"exposure"), exposure); 
    
    gl.bindBuffer(gl.ARRAY_BUFFER, viz.skyboxShape.vertexBuffer);
    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4 * 3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    var cameraMatrix = mat4.create(); 
    var lookPoint = vec3.clone(viz.camera.lookPoint); 
    vec3.subtract(lookPoint, lookPoint, viz.camera.viewPoint);
    mat4.lookAt(cameraMatrix, vec3.create(), lookPoint, viz.camera.viewUp); 
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraMatrix"), false, cameraMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, transforms.projection);
        
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, viz.skyboxCubemap); 
    gl.uniform1i(gl.getUniformLocation(program,'skyboxTexture'), 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, viz.skyboxShape.triIndexBuffer);
    gl.drawElements(gl.TRIANGLES, viz.skyboxShape.triLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function updateVisualizer(viz, time) {
    viz.camera.MAX_FRAMES = 25 - ($("#movementSlider").slider("value"));

    invertVert = $("#invertLook")[0].checked;
    invertHoriz = $("#invertHoriz")[0].checked;

    if (viz.camera.moving) {
        viz.camera.frameCount++;
        // console.log(viz.camera.moveVec + "   " + viz.camera.frameCount);
        mat4.multiply(viz.camera.cameraToWorld, viz.camera.cameraToWorld, viz.camera.moveTrans);
        viz.camera.updateBasis();
        if (viz.camera.frameCount == viz.camera.MAX_FRAMES) {viz.camera.moving = false; viz.camera.frameCount = 0;}
    }

    for (var i = 0; i < viz.objects.length; i++) {
        let object = viz.objects[i]
        if (!object.animation) continue;
        object.animation.update()
        updateShapeVertices(viz.gl, object.animation.aobject.gl_shape, object.animation.mesh.vertices);
        updateShapeNormals(viz.gl, object.animation.aobject.gl_shape, object.animation.mesh.normals);
    };

    var survivors = []
    for (var i = 0; i < viz.particles.length; i++){
        let particle = viz.particles[i]
        if (particle.update(time)){
            updateShapeVertices(viz.gl, particle.gl_shape, particle.particle.mesh.vertices);
            updateShapeFillColor(particle.gl_shape, particle.particle.mesh.fillColor);
            survivors.push(particle);
        }
    }

    if (viz.lightHigh() > 0.33){
        survivors.push(new PObject(viz.gl, 1, 
            [viz.camera.viewPoint[0]+3*Math.random()-1.5, viz.camera.viewPoint[1]+3*Math.random()-1.5, viz.camera.viewPoint[2]+3*Math.random()-1.5],
            viz.lightHigh()*2, viz.colors[Math.floor(viz.colors.length*Math.random())], 80000000));
    }
    if (Math.abs(viz.lightHigh() - viz.lastHigh) > 0.15){
        if (Math.random() > 0.6){
            setTimeout(() => {viz.explode();}, Math.floor(100*Math.random()));
        }
    }

    viz.gl.clearColor(...viz.clearColor, 0);
    viz.gl.clear(viz.gl.COLOR_BUFFER_BIT);
   
    var projectionMatrix = mat4.create(); const FOV = 70.0; const NEAR = 0.1; const FAR = 2000.0;
    mat4.perspective(projectionMatrix, FOV, viz.canvas.width / viz.canvas.height, NEAR, FAR);

    // var cameraMatrix = mat4.create();
    // mat4.lookAt(cameraMatrix, viz.camera.viewPoint, viz.camera.lookPoint, viz.camera.viewUp);

    var normalMatrix = mat4.create();    
    mat4.copy(normalMatrix, viz.camera.worldToCamera); mat4.invert(normalMatrix, normalMatrix); mat4.transpose(normalMatrix, normalMatrix);

    var transforms = { projection: projectionMatrix, camera: viz.camera.worldToCamera, normals: normalMatrix };
    
    var program = getProgram(viz.gl,'skybox','skybox'); viz.gl.useProgram(program);    
    
    var exposure = Math.max(0.5, viz.lightKick()) + 2*viz.lightHigh();
    drawSkybox(viz, viz.gl, program, transforms, exposure);        

    program = getProgram(viz.gl,'main','main'); viz.gl.useProgram(program);

    var lights = getLights(viz);

    viz.clearColor = viz.bgColor.map(color => 3*viz.lightHigh()*color);
    
    for (var i = 0; i < viz.objects.length; i++) {
        drawShape(viz.gl, viz.objects[i].gl_shape, program, transforms, lights,
            ENABLE_TEXTURES ? viz.objects[i].texture : null);
    };

    for (var i = 0; i < viz.particles.length; i++){
        drawShape(viz.gl, viz.particles[i].gl_shape, program, transforms, lights, null, true);
    }

    viz.particles = survivors;

    viz.gl.useProgram(null);

    viz.lastHigh = viz.lightHigh();
    viz.lastMid = viz.lightMid();
    viz.lastKick = viz.lightKick();
}

function getLights(viz)
{
    return { 
        positions: [
            viz.camera.viewPoint[0] - 40*viz.camera.viewDir[0], viz.camera.viewPoint[1] - 40*viz.camera.viewDir[1], viz.camera.viewPoint[2] - 40*viz.camera.viewDir[2],
            0,5,0,
            4.0,0.0,3.0,
            -4,0,3,
        ], 
        colors: [
            800,800,800,
            viz.lightHigh()*300,viz.lightHigh()*300,viz.lightHigh()*300,
            viz.lightKick()*20,0,0,
            0,0,viz.lightMid()*20,
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
    // if (ENABLE_TEXTURES){
    //     // Step 1: Create the texture object.
    //     wallTexture = viz.gl.createTexture();
    //     // Step 2: Bind the texture object to the "target" TEXTURE_2D
    //     viz.gl.bindTexture(viz.gl.TEXTURE_2D, wallTexture);
    //     // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
    //     //         so that we don't have to deal with flipping the y-coordinate.
    //     viz.gl.pixelStorei(viz.gl.UNPACK_FLIP_Y_WEBGL, true);
    //     // Step 4: Download the image data to the GPU.
    //     viz.gl.texImage2D(viz.gl.TEXTURE_2D, 0, viz.gl.RGBA, viz.gl.RGBA, viz.gl.UNSIGNED_BYTE, viz.earthImage);
    //     // Step 5: (Optional) Create a mipmap so that the texture can be anti-aliased.
    //     viz.gl.generateMipmap(viz.gl.TEXTURE_2D);
    //     // Step 6: Clean up.  Tell WebGL that we are done with the target.
    //     viz.gl.bindTexture(viz.gl.TEXTURE_2D, null);
    // }

    const size = 1000; viz.skyboxShape = createSkybox(viz.gl, size);
}

function getProgram(gl, vertName, fragName)
{
    var name = vertName+'_'+fragName;
    if (!(name in programs)) { 
        var program = createProgram(gl, vertName, fragName);
        program.name = name; programs[name] = program;
    }        
    return programs[name];
};

function createProgram(gl, vertName, fragName) 
{        
    var vertexShaderId = vertName+"_vertex_program";
    var fragmentShaderId = fragName+"_fragment_program";

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
};

function createShader(gl, shaderScriptId) 
{        
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
