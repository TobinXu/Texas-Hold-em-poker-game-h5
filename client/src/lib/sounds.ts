// Sound effects using Web Audio API — no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const gain = c.createGain();
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  // Bandpass for a more natural sound
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.7;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start(c.currentTime);
}

function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.1) {
  for (const freq of freqs) {
    playTone(freq, duration, type, volume / freqs.length);
  }
}

export const sounds = {
  // 发牌 — 短促的纸牌翻动声
  deal() {
    playNoise(0.06, 0.12);
    setTimeout(() => playNoise(0.04, 0.08), 30);
  },

  // 下注/跟注 — 筹码碰撞声
  chip() {
    playNoise(0.08, 0.1);
    playTone(800, 0.06, 'square', 0.04);
  },

  // 加注 — 更重的筹码声
  raise() {
    playNoise(0.1, 0.12);
    setTimeout(() => {
      playNoise(0.08, 0.1);
      playTone(900, 0.08, 'square', 0.05);
    }, 60);
  },

  // All In — 大筹码推出去
  allIn() {
    playNoise(0.15, 0.15);
    playTone(300, 0.15, 'sawtooth', 0.06);
    setTimeout(() => playNoise(0.1, 0.12), 80);
    setTimeout(() => playTone(500, 0.1, 'square', 0.04), 100);
  },

  // 过牌 — 轻敲桌面
  check() {
    playTone(220, 0.08, 'triangle', 0.1);
    playNoise(0.04, 0.06);
  },

  // 弃牌 — 低沉丢牌声
  fold() {
    playNoise(0.1, 0.06);
    playTone(180, 0.12, 'sine', 0.06);
  },

  // 新阶段 (flop/turn/river) — 翻牌提示
  newPhase() {
    playTone(523, 0.1, 'sine', 0.1);       // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 80);  // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 160); // G5
  },

  // 赢牌 — 欢快音效
  win() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.12), i * 120);
    });
  },

  // 摊牌 — 紧张的翻牌
  showdown() {
    playTone(440, 0.2, 'sine', 0.08);
    setTimeout(() => playTone(466, 0.2, 'sine', 0.08), 150);
    setTimeout(() => playTone(494, 0.3, 'sine', 0.1), 300);
  },

  // 轮到自己 — 提示音
  yourTurn() {
    playTone(880, 0.12, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.12), 100);
  },

  // 倒计时警告 — 紧迫感
  tickTock() {
    playTone(1000, 0.05, 'square', 0.06);
  },

  // 玩家加入
  playerJoin() {
    playTone(660, 0.08, 'sine', 0.08);
    setTimeout(() => playTone(880, 0.1, 'sine', 0.08), 60);
  },

  // 玩家离开
  playerLeave() {
    playTone(440, 0.1, 'sine', 0.06);
    setTimeout(() => playTone(330, 0.12, 'sine', 0.06), 80);
  },

  // 按钮点击
  click() {
    playTone(600, 0.04, 'square', 0.03);
  },

  // 错误提示
  error() {
    playTone(200, 0.2, 'sawtooth', 0.06);
    setTimeout(() => playTone(180, 0.25, 'sawtooth', 0.06), 150);
  },
};

export type SoundName = keyof typeof sounds;
