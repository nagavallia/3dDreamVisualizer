const ENABLE_TEXTURES = false;
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
        if (camera.orbitMode) {
            console.log('before viewPoint: ' + camera.viewPoint);
            var cameraMatrix = mat4.create();
            mat4.lookAt(cameraMatrix, camera.viewPoint, camera.lookPoint, camera.viewUp);

            var camMatInv = mat4.create();
            mat4.invert(camMatInv,cameraMatrix);
            var worldOrigin = vec4.fromValues(0,0,0,1);
            vec4.scale(worldOrigin, worldOrigin, worldOrigin[3]);

            var translate = mat4.create(); var transInv = mat4.create();
            mat4.fromTranslation(translate, vec3.fromValues(-worldOrigin[0], -worldOrigin[1], -worldOrigin[2]));
            mat4.invert(transInv, translate);

            vec3.transformMat4(camera.viewPoint,camera.viewPoint,translate);

            quat.setAxisAngle(xQuat, vec3.fromValues(0,1,0), xRot); quat.setAxisAngle(yQuat, vec3.fromValues(1,0,0), yRot);

            //apply quat rotation
            vec3.transformQuat(camera.viewDir, camera.viewDir, xQuat);
            vec3.transformQuat(camera.viewDir, camera.viewDir, yQuat);

            vec3.transformQuat(camera.viewPoint, camera.viewPoint, xQuat);
            vec3.transformQuat(camera.viewPoint, camera.viewPoint, yQuat);

            vec3.transformMat4(camera.viewPoint,camera.viewPoint,transInv);

            // console.log('after viewPoint: ' + camera.viewPoint);

        }
        else {
            quat.setAxisAngle(xQuat, camera.basisV, xRot); quat.setAxisAngle(yQuat, camera.basisU, yRot);

            //apply quat rotation
            vec3.transformQuat(camera.viewDir, camera.viewDir, xQuat);
            vec3.transformQuat(camera.viewDir, camera.viewDir, yQuat);
        }

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
            case 'f':
                camera.orbitMode = !camera.orbitMode;
                break;
            case '1':
                camera.viewPoint = vec3.fromValues(0.0,0.0,4.0);
                camera.viewDir = vec3.fromValues(0.0,0.0,-4.0);
                camera.viewUp = vec3.fromValues(0.0,1.0,0.0);
                break; 
            case '2':
                camera.viewPoint = vec3.fromValues(0.0,0.0,-4.0);
                camera.viewDir = vec3.fromValues(0.0,0.0,4.0);
                camera.viewUp = vec3.fromValues(0.0,1.0,0.0);
                break; 
            case '3':
                camera.viewPoint = vec3.fromValues(4.0,0.0,0.0);
                camera.viewDir = vec3.fromValues(-4.0,0.0,0.0);
                camera.viewUp = vec3.fromValues(0.0,1.0,0.0);
                break; 
            case '4':
                camera.viewPoint = vec3.fromValues(-4.0,0.0,0.0);
                camera.viewDir = vec3.fromValues(4.0,0.0,0.0);
                camera.viewUp = vec3.fromValues(0.0,1.0,0.0);
                break; 
            case '5':
                console.log('hello');
                camera.viewPoint = vec3.fromValues(0.0,4.0,0.0);
                camera.viewDir = vec3.fromValues(0.0,-4.0,0.0);
                camera.viewUp = vec3.fromValues(0.0,0.0,1.0);
                break; 
            case '6':
                camera.viewPoint = vec3.fromValues(0.0,-4.0,0.0);
                camera.viewDir = vec3.fromValues(0.0,4.0,0.0);
                camera.viewUp = vec3.fromValues(0.0,0.0,1.0);
                break; 
            case '7':
                camera.viewPoint = vec3.fromValues(11/1.3,15/1.3,16/1.3);
                camera.viewDir = vec3.fromValues(-1.7,-2.56,-2.56);
                camera.viewUp = vec3.fromValues(0.0,0.0,1.0);
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
    shape.normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
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

function updateShapeNormals(gl, shape, normals){
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function updateShapeFillColor(shape, color){
    shape.fillColor = color;
}

function drawShape(gl, shape, program, transforms, lights, texture = null, particles = false) {
    
    gl.useProgram(program);
    
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

    if (ENABLE_TEXTURES){
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
    gl.uniform3fv(gl.getUniformLocation(program, "color"), shape.lineColor);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.lineIndexBuffer);
    gl.drawElements(gl.LINES, shape.lineLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.useProgram(null);
}

function updateVisualizer(viz, time) {

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

    // Draw sky
    viz.gl.clearColor(...viz.clearColor, 0);
    viz.gl.clear(viz.gl.COLOR_BUFFER_BIT);
    viz.gl.useProgram(program);

    var projectionMatrix = mat4.create(); const FOV = 70.0; const NEAR = 0.1; const FAR = 100.0;
    mat4.perspective(projectionMatrix, FOV, viz.canvas.width / viz.canvas.height, NEAR, FAR);

    var cameraMatrix = mat4.create();
    mat4.lookAt(cameraMatrix, viz.camera.viewPoint, viz.camera.lookPoint, viz.camera.viewUp);

    //var pos = vec3.create(); var up = vec3.create(); var to = vec3.create(); 
    //vec3.set(pos, 0, 0, 4); vec3.set(up, 0, 1, 0); vec3.set(to, 0, 0, 0);
    //mat4.lookAt(cameraMatrix, pos, to, up);

    // mat4.rotate(cameraLoc, cameraLoc, current_t, Y_AXIS);
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(1*current_x-0.5, -1*getEyeHeight(), -1*current_y-0.5));
    // mat4.translate(cameraLoc, cameraLoc, vec3.fromValues(3, -1.5, 6));
    
    var normalMatrix = mat4.create();    
    mat4.copy(normalMatrix, cameraMatrix); mat4.invert(normalMatrix, normalMatrix); mat4.transpose(normalMatrix, normalMatrix);

    var transforms = { projection: projectionMatrix, camera: cameraMatrix, normals: normalMatrix };

    var lights = { 
        positions: [
            viz.camera.viewPoint[0] - 10*viz.camera.viewDir[0], viz.camera.viewPoint[1] - 10*viz.camera.viewDir[1], viz.camera.viewPoint[2] - 10*viz.camera.viewDir[2],
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

    viz.clearColor = viz.bgColor.map(color => 3*viz.lightHigh()*color);
    
    for (var i = 0; i < viz.objects.length; i++) {
        drawShape(viz.gl, viz.objects[i].gl_shape, program, transforms, lights,
            ENABLE_TEXTURES ? wallTexture : null);
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

/**
 * @return a Promise that resolves once
 * the vizualizer has been initialized
 */
const initVisualizer = (viz) => {

    viz.gl.depthFunc(viz.gl.LESS);
    viz.gl.enable(viz.gl.DEPTH_TEST);

    program = createGlslProgram(viz.gl, "vertexShader", "fragmentShader");

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


