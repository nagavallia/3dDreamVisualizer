
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
}


/**
 * Loads an audio file to an audio context
 */
const loadAudio = (context, name) => new Promise((res, rej) => {
  const request = new XMLHttpRequest()
  request.open("GET", "data/"+name, true)
  request.responseType = "arraybuffer"
  request.onerror = () => alert('BufferLoader: XHR error: '+name);
  
  // Load and decode
  request.onload = () => context
    .decodeAudioData(request.response,
      buffer => {
        if (!buffer) rej('error decoding file data: ' + "data/"+name)
        else res(buffer)
      },
      error => rej(error)
  );
  request.send();
})


const requestOBJFile = (name) => new Promise((res, rej) => {
    const request = new XMLHttpRequest();
    request.open("GET", "data/"+name, true);
    request.responseType = "arraybuffer";
    request.onerror = () => rej("OBJ XHR error or something");
    request.onload = () => { res(request.response)};
    request.send();
})


const loadImage = (name) => new Promise((res, rej) => {
    const img = new Image();
    img.src = "data/"+name
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

