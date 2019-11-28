function getFreqForFFTBin(bin, sampleRate, fftLength) {
  return bin * sampleRate / fftLength;
}

function getFFTBinForFreq(freq, sampleRate, fftLength) {
  return freq * fftLength / sampleRate;
}

module.exports = {
  getFreqForFFTBin: getFreqForFFTBin,
  getFFTBinForFreq: getFFTBinForFreq,
}
