importScripts('../lib/pcmdata.min.js', '../lib/amrnb.min.js');

function decodeAMR(buffer) {

	var amr = new AMR({
		benchmark: false
	});

	// Make sure we're using a Unit8 view on the array buffer. If the file
	// comes back as a string, I think there might be some endianness issues
	// in converting it back to numbers, so keep the bit data this way.
	var arrayView = new Uint8Array(buffer);

	postMessage("starting decode");
	var starttime = new Date().getTime();
	var samples = amr.decode(arrayView);
	var decodetime = new Date().getTime();

	postMessage("finished decode: " + (decodetime - starttime));

	var peaks;

	if (samples) {

		// This is the same getPeaks implementation from wavesurfer,
		// but modified to use our decoded AMR data.
		var length = 640;
    var sampleSize = samples.length / length;
    var sampleStep = ~~(sampleSize / 10) || 1;
    peaks = new Float32Array(length);

    for (var i = 0; i < length; i++) {
      var start = ~~(i * sampleSize);
      var end = ~~(start + sampleSize);
      var max = 0;
      for (var j = start; j < end; j += sampleStep) {
        var value = samples[j];
        if (value > max) {
            max = value;
        // faster than Math.abs
        } else if (-value > max) {
            max = -value;
        }
      }
      if (max > peaks[i]) {
        peaks[i] = max;
      }
    }
  }

  return peaks;
}

self.addEventListener('message', function(e) {

	var data = e.data;

	// Process the response.
	var float32peaks = decodeAMR(data);

	// Ugh. Why is this such a pain.
	var peaks = new Array(float32peaks.length);
	for (var i=0; i<peaks.length; ++i) {
		peaks[i] = float32peaks[i];
	}

	// Send the message with the peaks back to the caller
	// "*" Defines any origin.
	// Note that we can only send arraybuffers.
	postMessage({ peaks: JSON.stringify(peaks) });

}, false);