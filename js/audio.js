let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, duration, vol, delay) {
  type = type || 'sine'; duration = duration || 0.2; vol = vol || 0.3; delay = delay || 0;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
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

function playSound(name) {
  try {
    if (name === 'tap')    { playTone(440,'sine',0.15,0.3); playTone(660,'sine',0.1,0.2,0.05); }
    if (name === 'belly')  { playTone(220,'sine',0.3,0.4); playTone(330,'triangle',0.2,0.25,0.1); }
    if (name === 'star')   { playTone(880,'triangle',0.12,0.3); playTone(1100,'triangle',0.1,0.2,0.07); }
    if (name === 'flower') { playTone(523,'sine',0.2,0.3); playTone(659,'sine',0.15,0.25,0.1); }
    if (name === 'heart')  { playTone(659,'sine',0.15,0.35); playTone(784,'sine',0.1,0.25,0.12); }
    if (name === 'rainbow') {
      [261,330,392,523,659,784,1047].forEach(function(f,i) { playTone(f,'triangle',0.4,0.3,i*0.07); });
    }
  } catch(e) {}
}
