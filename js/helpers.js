
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

