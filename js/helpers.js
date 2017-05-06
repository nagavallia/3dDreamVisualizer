
/**
 * Loads things into a target object
 */
class ResourceLoader {
  constructor (target) { this.target = target || this }

  loadAudio(name, path, context) {
    return loadAudio(context, path)                // loads audio
      .then(buffer => this.target[name] = buffer)  // saves it
      .then(() => this)                            // good for chaining requests
  }

  load3DObj(name, path) {
    return requestOBJFile(path)
      .then(buffer => this.target[name] = buffer)
      .then(() => this)
  }

  loadImage(name, path) {
    return loadImage(path)
      .then(image => this.target[name] = image)
      .then(() => this)
  }

  registerObjSource(selector, callback) {
    document.querySelector(selector).onChange(function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = function () { callback(event.target.result)}
      reader.readAsArrayBuffer(file);
    }) 
  }

  registerAudioSource(selector, context, callback) {
    document.querySelector(selector).onChange(function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = function(event) {
        context.decodeAudioData(event.target.result,
          buffer => {
            if (!buffer) rej('error decoding file data: ' + url)
            else callback(buffer, null)
          },
          error => callback(null, error)
        );
      };
      reader.readAsArrayBuffer(file);
    }) 
  }
}

/**
 * Loads an audio file to an audio context
 */
const loadAudio = (context, path) => new Promise((res, rej) => {
  const request = new XMLHttpRequest()
  request.open("GET", path, true)
  request.responseType = "arraybuffer"
  request.onerror = () => alert('BufferLoader: XHR error');

  // Load and decode
  request.onload = () => context
    .decodeAudioData(request.response,
      buffer => {
        if (!buffer) rej('error decoding file data: ' + url)
        else res(buffer)
      },
      error => rej(error)
  );
  request.send();
})


const requestOBJFile = (filename) => new Promise((res, rej) => {
    const request = new XMLHttpRequest();
    request.open("GET", "data/"+filename, true);
    request.responseType = "arraybuffer";
    request.onerror = () => rej("OBJ XHR error or something");
    request.onload = () => { res(request.response)};
    request.send();
})


const loadImage = (url) => new Promise((res, rej) => {
    const img = new Image();
    img.src = url
    img.onload = () => res(img)
    img.onerror = () => rej("couldn't load image!")
})


/* From: https://gist.github.com/gre/1650294
 * Easing Functions - inspired from http://gizma.com/easing/
 * only considering the t value for the range [0, 1] => [0, 1]
 */
const ease = {
  // no easing, no acceleration
  linear: t => t,
  // accelerating from zero velocity
  inQuad: t => t*t,
  // decelerating to zero velocity
  outQuad: t => t*(2-t),
  // acceleration until halfway, then deceleration
  inOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  // accelerating from zero velocity
  inCubic: t => t*t*t,
  // decelerating to zero velocity
  outCubic: t => (--t)*t*t+1,
  // acceleration until halfway, then deceleration
  inOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
  // accelerating from zero velocity
  inQuart: t => t*t*t*t,
  // decelerating to zero velocity
  outQuart: t => 1-(--t)*t*t*t,
  // acceleration until halfway, then deceleration
  inOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
  // accelerating from zero velocity
  inQuint: t => t*t*t*t*t,
  // decelerating to zero velocity
  outQuint: t => 1+(--t)*t*t*t*t,
  // acceleration until halfway, then deceleration
  inOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
  // threshold
  threshold: x => t => t < x ? 0 : 1
}

// REF http://stackoverflow.com/a/5624139 for color conversions
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
// end REF

function hexTo01(hex){
  var rgb = hexToRgb(hex);
  return [rgb.r/255, rgb.g/255, rgb.b/255, 0];
}