var vbAudioCtx = null;

function vbGetCtx() {
  if (!vbAudioCtx) vbAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (vbAudioCtx.state === 'suspended') vbAudioCtx.resume();
  return vbAudioCtx;
}

function vbTone(freq, type, duration, vol, delay) {
  type = type||'sine'; duration = duration||0.2; vol = vol||0.3; delay = delay||0;
  try {
    var ctx = vbGetCtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch(e) {}
}

function vbPlaySound(name) {
  if (name === 'hit') {
    vbTone(220, 'triangle', 0.08, 0.5);
    vbTone(440, 'sine', 0.12, 0.3, 0.04);
  }
  if (name === 'miss') {
    vbTone(200, 'sine', 0.3, 0.3);
    vbTone(150, 'sine', 0.3, 0.2, 0.15);
  }
  if (name === 'score') {
    [523,659,784,1047].forEach(function(f,i) { vbTone(f,'triangle',0.25,0.35,i*0.08); });
  }
  if (name === 'win') {
    [523,659,784,1047,1319,1568].forEach(function(f,i) { vbTone(f,'triangle',0.3,0.4,i*0.09); });
  }
  if (name === 'countdown') {
    vbTone(660, 'triangle', 0.15, 0.4);
  }
}

function vbSpeak(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.4; utt.pitch = 2.0; utt.volume = 1.0;
    var voices = window.speechSynthesis.getVoices();
    var pick = voices.find(function(v) { return v.name.includes('Google') && v.lang.startsWith('en'); })
            || voices.find(function(v) { return v.lang.startsWith('en'); })
            || voices[0];
    if (pick) utt.voice = pick;
    window.speechSynthesis.speak(utt);
  } catch(e) {}
}
