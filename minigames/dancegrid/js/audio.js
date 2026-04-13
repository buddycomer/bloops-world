var dgAudioCtx = null;

function dgGetCtx() {
  if (!dgAudioCtx) dgAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (dgAudioCtx.state === 'suspended') dgAudioCtx.resume();
  return dgAudioCtx;
}

// Pentatonic scale — always sounds happy
var DG_NOTES = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];

function dgPlayNote(freq, duration, vol) {
  duration = duration || 0.35; vol = vol || 0.4;
  try {
    var ctx = dgGetCtx();
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    var filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 3000;
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch(e) {}
}

function dgPlayCelebration(size) {
  var melodies = {
    small:  [523, 659, 784],
    medium: [523, 659, 784, 1047],
    large:  [523, 659, 784, 1047, 1319],
    huge:   [523, 659, 784, 1047, 1319, 1568, 2093]
  };
  var notes = melodies[size] || melodies.small;
  notes.forEach(function(f, i) {
    setTimeout(function() { dgPlayNote(f, 0.3, 0.35); }, i * 100);
  });
}

function dgPlayMiss() {
  try {
    var ctx = dgGetCtx();
    var osc  = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch(e) {}
}

function dgSpeak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var utt = new SpeechSynthesisUtterance(text);
    utt.rate   = 1.4;
    utt.pitch  = 2.0;
    utt.volume = 1.0;
    var voices = window.speechSynthesis.getVoices();
    var pick = voices.find(function(v) { return v.name.includes('Google') && v.lang.startsWith('en'); })
            || voices.find(function(v) { return v.lang.startsWith('en'); })
            || voices[0];
    if (pick) utt.voice = pick;
    window.speechSynthesis.speak(utt);
  } catch(e) {}
}
