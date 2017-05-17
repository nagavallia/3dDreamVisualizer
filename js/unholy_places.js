/**
 * I'm not proud of this
 * JK low key kinda am. It works.
 * Thanks, https://github.com/dondido/MP3-to-Base64-Encoder-and-Decoder/blob/master/index.html
 */

// Converts an ArrayBuffer to base64, by converting to string 
// and then using window.btoa' to base64. 
var bufferToBase64 = function (buffer) {
  var bytes = new Uint8Array(buffer);
  var len = buffer.byteLength;
  var binary = "";
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/mp3;base64,' + window.btoa(binary);
}

const registerAudioTagSource = function (fileselector, audioselector) {
  document.querySelector(fileselector).onchange = function (event) {
    const file = event.target.files[0]
    console.log(file)
    const reader = new FileReader()
    reader.onload = function(event) {
      const base64String = bufferToBase64(event.target.result);
      document.querySelector(audioselector).src = base64String
    };
    reader.readAsArrayBuffer(file);
  }
}