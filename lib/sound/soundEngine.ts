let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("pico_sound") === "false") return;

  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    return;
  }
}

function playChord(frequencies: number[], duration: number, volume = 0.2) {
  frequencies.forEach((frequency) => playTone(frequency, duration, "sine", volume));
}

export const Sound = {
  correct: () => {
    playTone(523.25, 0.15, "sine", 0.25);
    window.setTimeout(() => playTone(659.25, 0.2, "sine", 0.25), 100);
  },
  incorrect: () => {
    playTone(220, 0.08, "sawtooth", 0.2);
    window.setTimeout(() => playTone(196, 0.15, "sawtooth", 0.2), 80);
  },
  combo: (level: number) => {
    const frequencies = [523, 659, 784, 1047];
    playTone(frequencies[Math.min(level - 1, 3)] ?? 523, 0.3, "sine", 0.3);
  },
  levelUp: () => playChord([523, 659, 784, 1047], 0.8, 0.25),
  promoted: () => {
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((frequency, index) => {
      window.setTimeout(() => playTone(frequency, 0.2, "sine", 0.3), index * 80);
    });
  },
  heartLost: () => playTone(180, 0.4, "triangle", 0.3),
  packOpen: () => {
    playTone(440, 0.05, "square", 0.15);
    window.setTimeout(() => playChord([659, 784, 988], 0.5, 0.2), 200);
  },
  click: () => playTone(800, 0.04, "sine", 0.1),
  success: () => playChord([523, 659, 784], 0.6, 0.2),
  bossHit: () => {
    playTone(100, 0.2, "sawtooth", 0.4);
    playTone(150, 0.15, "square", 0.3);
  },
  bossDefeat: () => {
    [200, 300, 400, 500, 600, 800].forEach((frequency, index) => {
      window.setTimeout(() => playTone(frequency, 0.3, "sine", 0.35), index * 100);
    });
  },
  rivalOvertake: () => playChord([784, 988, 1175], 0.4, 0.25),
  tickClick: () => playTone(1200, 0.02, "sine", 0.08),
};
