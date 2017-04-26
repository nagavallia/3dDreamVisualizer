
/* global UI, mat4, vec3, createjs */

Renderer = function(canvas){
    
    this.programs = { }; this.textures = { }; this.draws = 0; this.lastT = 0;
    this.Camera = null; this.loaded = false;
    
    var gl = canvas.getContext("webgl");
    if (!gl) { gl = canvas.getContext("experimental-webgl");
        if (!gl) { alert("Cannot get WebGL context!"); return false; } }

    this.canvas = canvas; this.gl = gl;
    
    this.near = 0.1; this.far = 100.0;
    this.width = $(canvas).width(); this.height = $(canvas).height();   

    //this.Camera = { position: vec3.create(), heading: mazeData.startHeading, FOV: null };        
    //vec3.set(this.Camera.position, mazeData.startPosition[0]+0.5, mazeData.startPosition[1]+0.5, 0);
    
    this.Update = function(delta)
    {
        // this.Camera.FOV = UI.getFov(); this.Camera.position[2] = UI.getEyeHeight();     
    };
    
    this.Draw = function()
    {
        var gl = this.gl; var color = UI.getBackColor();
        gl.clearColor(color[0], color[1], color[2], 1.0); gl.clear(gl.COLOR_BUFFER_BIT);         
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.BLEND); gl.enable(gl.DEPTH_TEST); 
        
        if (this.loaded)
        {
            var now = Date.now(); var delta = (now-this.lastT)/1000; this.lastT = now; this.Update(delta); //var exposure = UI.getExposure();

            /*program = this.getProgram('skybox','skybox'); gl.useProgram(program);
            gl.uniform1f(gl.getUniformLocation(program,"exposure"), exposure);        
            this.SetTransforms(program, true); this.drawSkybox(program);
            
            var program = this.getProgram('main','main'); gl.useProgram(program);            
            gl.uniform1f(gl.getUniformLocation(program,"exposure"), exposure);        
            this.SetTransforms(program, false); this.setLights(program); 
            this.drawFloor(program); this.drawWalls(program);*/
            
            this.draws++;  
        } 
        
        var self = this; window.requestAnimationFrame(function(){ self.Draw(); }); 
    };
    
    this.SetTransforms = function(program, skybox)
    {
        var projectionMatrix = mat4.create(); 
        var cameraMatrix = mat4.create();
        var normalMatrix = mat4.create();
        
        mat4.perspective(projectionMatrix, this.Camera.FOV, this.width/this.height, this.near, !skybox ? this.far : 2*this.MazeData.sizeX + 2*this.MazeData.sizeY);

        var pos = !skybox ? this.Camera.position : vec3.create(); var up = vec3.create(); vec3.set(up, 0, 0, 1);
        var to = vec3.create(); vec3.set(to, 
            Math.cos(this.Camera.heading)+pos[0], 
            Math.sin(this.Camera.heading)+pos[1], pos[2]);

        mat4.lookAt(cameraMatrix, pos, to, up);
        
        mat4.copy(normalMatrix, cameraMatrix); mat4.invert(normalMatrix, normalMatrix); mat4.transpose(normalMatrix, normalMatrix);

        gl.uniformMatrix4fv(gl.getUniformLocation(program,"projectionMatrix"), false, projectionMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program,"cameraMatrix"), false, cameraMatrix);
        if (!skybox) gl.uniformMatrix4fv(gl.getUniformLocation(program,"normalMatrix"), false, normalMatrix);
    };
      
    this.setSkybox = function()
    {
        var vertices = []; var indexes = []; var d = this.MazeData.sizeX + this.MazeData.sizeY;
        
        vertices.push(-d,-d,d, d,-d,d, d,d,d, -d,d,d, -d,-d,-d, d,-d,-d, d,d,-d, -d,d,-d);
        indexes.push(4,0,7, 7,0,3, 0,1,3, 3,1,2, 1,5,2, 2,5,6, 5,4,6, 6,4,7, 0,2,7, 7,2,6, 4,5,0, 0,5,1);
        
        this.Skybox = { vertices: new Float32Array(vertices), indexes: new Uint16Array(indexes) }; 
    };
    
    this.setLights = function(program)
    {
        var bright = UI.getLightIntensity(); gl.uniform3f(gl.getUniformLocation(program,"lightColor"), bright, bright, bright);  
        
        var x = this.MazeData.sizeX; var y = this.MazeData.sizeY; var h = 20;        
        var lights = [ 
            -h,y/2,0, x/2,-h,h, h+x,y/2,h, x/2,h+y,h, x/2,y/2,h,
            //0.5,0.5,h, x-0.5,0.5,h, 0.5,y-0.5,h, x-0.5,y-0.5,h, x/2,y/2,h,
            1/4*x,1/4*y,h, 3/4*x,1/4*y,h, 1/4*x,3/4*y,h, 3/4*x,3/4*y,h ];        
        gl.uniform3fv(gl.getUniformLocation(program,"lightPositions"), lights);
    };
    
    this.drawSkybox = function(program)
    {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.textures.skybox); gl.uniform1i(gl.getUniformLocation(program,'skyboxTexture'), 0);
        
        this.GLBufferAndDraw(program, this.Skybox.vertices, this.Skybox.indexes.length, gl.TRIANGLES, [
            new Renderer.GLVertexAttrib("position",gl.FLOAT,4,3)], this.Skybox.indexes);
    };
    
    /*this.drawFloor = function(program)
    {
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.textures.floor.diffuse); gl.uniform1i(gl.getUniformLocation(program,'diffuseTexture'), 0);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.textures.floor.specular); gl.uniform1i(gl.getUniformLocation(program,'specularTexture'), 1);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.textures.floor.normal); gl.uniform1i(gl.getUniformLocation(program,'normalTexture'), 2);
        
        gl.uniform1f(gl.getUniformLocation(program,"roughness"), UI.getFloorRoughness()); 
        gl.uniform1f(gl.getUniformLocation(program,"bumpiness"), UI.getFloorBumpiness()); 
        
        this.GLBufferAndDraw(program, this.Floor.vertices, this.Floor.indexes.length, gl.TRIANGLES, [
            new Renderer.GLVertexAttrib("position",gl.FLOAT,4,3),
            new Renderer.GLVertexAttrib("normal",gl.FLOAT,4,3),
            new Renderer.GLVertexAttrib("tangent1",gl.FLOAT,4,3),
            new Renderer.GLVertexAttrib("tangent2",gl.FLOAT,4,3),
            new Renderer.GLVertexAttrib("uv",gl.FLOAT,4,2)], this.Floor.indexes);
    };*/
    
    this.LoadAssets = function()
    {
        var queue = new createjs.LoadQueue();
        
        queue.loadManifest([
            { id:"texture_floor_diffuse",   src:"data/textures/floor/diffuse.png" },
            { id:"texture_floor_specular",  src:"data/textures/floor/specular.png" },
            { id:"texture_floor_normal",    src:"data/textures/floor/normal.png" },
            { id:"texture_walls_diffuse",    src:"data/textures/walls/diffuse.png" },
            { id:"texture_walls_specular",   src:"data/textures/walls/specular.png" },
            { id:"texture_walls_normal",     src:"data/textures/walls/normal.png" },
            { id:"texture_skybox+X",       src:"data/textures/skybox/+X.png" },
            { id:"texture_skybox+Y",       src:"data/textures/skybox/+Y.png" },
            { id:"texture_skybox+Z",       src:"data/textures/skybox/+Z.png" },
            { id:"texture_skybox-X",       src:"data/textures/skybox/-X.png" },
            { id:"texture_skybox-Y",       src:"data/textures/skybox/-Y.png" },
            { id:"texture_skybox-Z",       src:"data/textures/skybox/-Z.png" },
        ]); 
        
        queue.on("complete",function() { 
            this.SetTexture(queue,"floor");
            this.SetTexture(queue,"walls");     
            this.SetSkyboxTextures(queue);
            this.loaded = true; console.log("Loaded Textures!");
        },this);
        
    }; this.LoadAssets();
    
    this.SetTexture = function(files, name)
    { 
        this.textures[name] = {
            diffuse: this.CreateTexture(files.getResult("texture_"+name+"_diffuse", false)),
            specular: this.CreateTexture(files.getResult("texture_"+name+"_specular", false)),
            normal: this.CreateTexture(files.getResult("texture_"+name+"_normal", false)),            
        };
    };
    
    this.CreateTexture = function(image)
    {
        var gl = this.gl;
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return texture;
    };
    
    this.SetSkyboxTextures = function(files)
    {
        var gl = this.gl;
        var cubemap = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemap);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/+X.png", false));
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/+Y.png", false));
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/+Z.png", false));
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/-X.png", false));
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/-Y.png", false));
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE, 
            files.getResult("data/textures/skybox/-Z.png", false));
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        this.textures['skybox'] = cubemap;
    };
    
    this.GLBufferAndDraw = function(program, vertices, numVertices, drawType, attribs, faceIndexes)
    {
        var gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        this.GLSetVertexAttribPointers(attribs, program, true);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        if (faceIndexes) {              
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());           
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceIndexes, gl.STATIC_DRAW);
            gl.drawElements(drawType, numVertices, gl.UNSIGNED_SHORT, 0); 
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null); 
        }
        else { gl.drawArrays(drawType, 0, numVertices); }
        this.GLSetVertexAttribPointers(attribs, program, false);
    };
    
    this.GLSetVertexAttribPointers = function(attribs, program, turnon)
    {
        var gl = this.gl; var used = 0; var stride = 0; 
        for (var index in attribs) { var attrib = attribs[index]; stride += attrib.num*attrib.typesize; }
        
        for (var index in attribs)
        {
            var attrib = attribs[index];
            var location = gl.getAttribLocation(program, attrib.name);
            if (turnon) {
                gl.enableVertexAttribArray(location);
                gl.vertexAttribPointer(location, attrib.num, attrib.type, false, stride, used); 
            } else { gl.disableVertexAttribArray(location); }
            used += attrib.num*attrib.typesize;
        }
    };    
    
    this.getProgram = function(vertName, fragName)
    {
        var name = vertName+'_'+fragName;
        if (!(name in this.programs)) { 
            var program = this.createProgram(vertName, fragName);
            program.name = name; this.programs[name] = program;
        }        
        return this.programs[name];
    };
    
    this.createProgram = function(vertName, fragName) 
    {        
        var gl = this.gl; 
        var vertexShaderId = vertName+"_vertex_program";
        var fragmentShaderId = fragName+"_fragment_program";
        
        var program = gl.createProgram();

        gl.attachShader(program, this.createShader(vertexShaderId));
        gl.attachShader(program, this.createShader(fragmentShaderId));
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
    
    this.createShader = function(shaderScriptId) 
    {        
        var gl = this.gl;
        
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
};
    
Renderer.GLVertexAttrib = function(name, type, typesize, num) { this.name = name; this.type = type; this.typesize = typesize; this.num = num; };