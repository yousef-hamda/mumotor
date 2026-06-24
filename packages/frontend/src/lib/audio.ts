/**
 * Procedural engine sound via the Web Audio API — no audio files, no licensing.
 * Must be triggered from a user gesture (browsers create the AudioContext
 * suspended otherwise). Models an ignition → rev → settle-to-idle → fade curve
 * with detuned sawtooth oscillators through a low-pass filter plus combustion
 * noise. Returns a handle so callers can stop it early.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

export interface EngineHandle {
  stop: () => void;
}

/** Fire the engine: crank → rev → idle → fade. ~4.4s total. */
export function playEngineStart(opts?: { volume?: number; onSettle?: () => void }): EngineHandle {
  let ac: AudioContext;
  try {
    ac = getCtx();
  } catch {
    return { stop: () => {} };
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const vol = opts?.volume ?? 0.6;
  const t0 = ac.currentTime;

  const master = ac.createGain();
  master.gain.value = 0;
  master.connect(ac.destination);

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  lp.Q.value = 0.7;
  lp.connect(master);

  // Detuned sawtooths sharing one RPM curve → a rich engine timbre.
  const detunes = [-8, 0, 7];
  const oscs = detunes.map((d, i) => {
    const o = ac.createOscillator();
    o.type = 'sawtooth';
    o.detune.value = d;
    const g = ac.createGain();
    g.gain.value = i === 1 ? 0.55 : 0.32;
    o.connect(g);
    g.connect(lp);
    return o;
  });

  // Combustion noise (band-passed) layered under the tone.
  const noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const noiseBp = ac.createBiquadFilter();
  noiseBp.type = 'bandpass';
  noiseBp.frequency.value = 240;
  noiseBp.Q.value = 0.8;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(noiseBp);
  noiseBp.connect(noiseGain);
  noiseGain.connect(master);

  const setF = (f: number, t: number) => oscs.forEach((o) => o.frequency.setValueAtTime(f, t));
  const rampF = (f: number, t: number) => oscs.forEach((o) => o.frequency.exponentialRampToValueAtTime(f, t));

  // Ignition crank
  setF(26, t0);
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.linearRampToValueAtTime(vol * 0.85, t0 + 0.14);
  // Rev up
  rampF(155, t0 + 1.35);
  lp.frequency.setValueAtTime(700, t0 + 0.14);
  lp.frequency.linearRampToValueAtTime(2600, t0 + 1.35);
  master.gain.linearRampToValueAtTime(vol, t0 + 0.9);
  // Settle to idle
  rampF(58, t0 + 2.5);
  lp.frequency.linearRampToValueAtTime(1000, t0 + 2.5);
  master.gain.linearRampToValueAtTime(vol * 0.55, t0 + 2.5);
  // Fade out
  master.gain.setValueAtTime(vol * 0.55, t0 + 2.9);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.3);

  oscs.forEach((o) => o.start(t0));
  noise.start(t0);
  const stopAt = t0 + 4.5;
  oscs.forEach((o) => o.stop(stopAt));
  noise.stop(stopAt);

  if (opts?.onSettle) window.setTimeout(() => opts.onSettle?.(), 2200);

  let stopped = false;
  return {
    stop() {
      if (stopped) return;
      stopped = true;
      try {
        const now = ac.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(0, now, 0.12);
      } catch {
        /* noop */
      }
    },
  };
}
