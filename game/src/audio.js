// audio.js — all sound is WebAudio, no files, no network.
// One job: short feedback sounds (chop, sizzle, serve, alarm).

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + (when || 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain || 0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playChop() {
  tone(180, 0.08, 'square', 0.10);
  tone(120, 0.08, 'square', 0.08, 0.07);
}

export function playPick() {
  tone(520, 0.07, 'sine', 0.10);
}

export function playCookDone() {
  tone(660, 0.12, 'sine', 0.12);
  tone(880, 0.15, 'sine', 0.12, 0.10);
}

export function playServe() {
  tone(523, 0.12, 'triangle', 0.14);
  tone(659, 0.12, 'triangle', 0.14, 0.10);
  tone(784, 0.20, 'triangle', 0.14, 0.20);
}

export function playFail() {
  tone(220, 0.25, 'sawtooth', 0.08);
  tone(165, 0.30, 'sawtooth', 0.08, 0.15);
}

export function playRush() {
  tone(440, 0.10, 'square', 0.10);
  tone(440, 0.10, 'square', 0.10, 0.14);
  tone(587, 0.18, 'square', 0.10, 0.28);
}

export function playClick() {
  tone(700, 0.05, 'sine', 0.08);
}
