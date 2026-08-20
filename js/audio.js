/* ==========================================================================
   帕帕 · 小南瓜 | 湖畔圣域 — 空灵白噪音与治愈环境音引擎 (Web Audio Ambient Engine)
   100% 纯原生 Web Audio API 算法合成，零外部音频资源依赖，极致省电，离线秒开
   ========================================================================== */

const AmbientEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let currentTrackId = 'ripple';
  let activeNodes = [];
  let intervalTimers = [];

  const TRACKS = [
    {
      id: 'ripple',
      name: '湖畔微澜',
      sub: '轻柔水波与微风拍岸',
      icon: '🌊',
      tag: '治愈流水',
      desc: '温柔的湖水涟漪与细流潺潺，抚平内心的焦虑与浮躁。',
      color: '#38bdf8'
    },
    {
      id: 'rain',
      name: '空山新雨',
      sub: '淅沥细雨与芭蕉滴水',
      icon: '🌧️',
      tag: '专注降噪',
      desc: '沉静连绵的雨丝打在荷叶上，适合专注沉浸与深度工作。',
      color: '#60a5fa'
    },
    {
      id: 'forest',
      name: '林间清风',
      sub: '竹林沙沙与空灵风铃',
      icon: '🍃',
      tag: '放松解压',
      desc: '穿越松林的轻柔微风与悠远风铃，唤醒自然的宁静生机。',
      color: '#34d399'
    },
    {
      id: 'fireplace',
      name: '暖阁柴火',
      sub: '噼啪炭火与温暖低频',
      icon: '🪵',
      tag: '温暖助眠',
      desc: '炉火轻燃的噼啪微响与暖意，带来无与伦比的安全与治愈。',
      color: '#fb923c'
    },
    {
      id: 'bell',
      name: '静夜禅钟',
      sub: '空灵颂钵与梵音回响',
      icon: '🎐',
      tag: '冥想正念',
      desc: '深沉回荡的古刹铜钟与颂钵和弦，引你进入深邃宁静的意境。',
      color: '#a78bfa'
    },
    {
      id: 'abyss',
      name: '星海幽梦',
      sub: '深空低鸣与宇宙呼吸',
      icon: '🌌',
      tag: '灵感催化',
      desc: '深邃悠远的宇宙环境低频垫音，适合编程与夜间发散思考。',
      color: '#f472b6'
    }
  ];

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      const savedVol = typeof state !== 'undefined' && state.ambientVolume !== undefined ? state.ambientVolume : 0.6;
      masterGain.gain.setValueAtTime(savedVol, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // 生成粉红噪声数据块
  function createNoiseBuffer(audioCtx, type = 'pink') {
    const bufferSize = audioCtx.sampleRate * 3;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.12;
      }
    }
    return buffer;
  }

  function stopCurrentTrack(fadeSec = 0.3) {
    intervalTimers.forEach(t => clearInterval(t));
    intervalTimers = [];

    if (activeNodes.length > 0 && ctx) {
      const now = ctx.currentTime;
      activeNodes.forEach(item => {
        try {
          if (item.gainNode) {
            item.gainNode.gain.cancelScheduledValues(now);
            item.gainNode.gain.setValueAtTime(item.gainNode.gain.value, now);
            item.gainNode.gain.linearRampToValueAtTime(0, now + fadeSec);
          }
          setTimeout(() => {
            try { item.source?.stop?.(); item.source?.disconnect?.(); } catch {}
          }, fadeSec * 1000 + 40);
        } catch {}
      });
      activeNodes = [];
    }
  }

  // 1. 🌊 湖畔微澜 (Lakeside Ripple)
  function synthesizeRipple(audioCtx, outGain) {
    const noiseBuffer = createNoiseBuffer(audioCtx, 'pink');
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);
    filter.Q.setValueAtTime(2.2, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime);

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(180, audioCtx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const trackGain = audioCtx.createGain();
    trackGain.gain.setValueAtTime(0, audioCtx.currentTime);
    trackGain.gain.linearRampToValueAtTime(0.85, audioCtx.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(trackGain);
    trackGain.connect(outGain);

    noise.start();
    lfo.start();

    // 水泡音
    const bubbleTimer = setInterval(() => {
      if (!isPlaying) return;
      try {
        const osc = audioCtx.createOscillator();
        const bGain = audioCtx.createGain();
        const startFreq = 420 + Math.random() * 450;
        const now = audioCtx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.linearRampToValueAtTime(startFreq * 1.4, now + 0.1);
        bGain.gain.setValueAtTime(0, now);
        bGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        bGain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(bGain);
        bGain.connect(outGain);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch {}
    }, 500);

    intervalTimers.push(bubbleTimer);
    activeNodes.push({ source: noise, gainNode: trackGain }, { source: lfo });
  }

  // 2. 🌧️ 空山新雨 (Mountain Rain)
  function synthesizeRain(audioCtx, outGain) {
    const rainBuffer = createNoiseBuffer(audioCtx, 'pink');
    const rainSource = audioCtx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const filter1 = audioCtx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(1500, audioCtx.currentTime);
    filter1.Q.setValueAtTime(0.8, audioCtx.currentTime);

    const filter2 = audioCtx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(3800, audioCtx.currentTime);

    const trackGain = audioCtx.createGain();
    trackGain.gain.setValueAtTime(0, audioCtx.currentTime);
    trackGain.gain.linearRampToValueAtTime(0.9, audioCtx.currentTime + 0.5);

    rainSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(trackGain);
    trackGain.connect(outGain);

    rainSource.start();

    // 随机雨滴
    const dropTimer = setInterval(() => {
      if (!isPlaying) return;
      try {
        const osc = audioCtx.createOscillator();
        const dropGain = audioCtx.createGain();
        const now = audioCtx.currentTime;
        const baseFreq = 800 + Math.random() * 1000;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.4, now + 0.07);
        dropGain.gain.setValueAtTime(0, now);
        dropGain.gain.linearRampToValueAtTime(0.1, now + 0.01);
        dropGain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.connect(dropGain);
        dropGain.connect(outGain);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch {}
    }, 150);

    intervalTimers.push(dropTimer);
    activeNodes.push({ source: rainSource, gainNode: trackGain });
  }

  // 3. 🍃 林间清风 (Forest Breeze & Chimes)
  function synthesizeForest(audioCtx, outGain) {
    const windBuffer = createNoiseBuffer(audioCtx, 'pink');
    const wind = audioCtx.createBufferSource();
    wind.buffer = windBuffer;
    wind.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);
    filter.Q.setValueAtTime(1.5, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime);

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(220, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const trackGain = audioCtx.createGain();
    trackGain.gain.setValueAtTime(0, audioCtx.currentTime);
    trackGain.gain.linearRampToValueAtTime(0.85, audioCtx.currentTime + 0.5);

    wind.connect(filter);
    filter.connect(trackGain);
    trackGain.connect(outGain);

    wind.start();
    lfo.start();

    // 随机空灵五度风铃声
    const chimeFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const chimeTimer = setInterval(() => {
      if (!isPlaying) return;
      if (Math.random() > 0.45) return;
      try {
        const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
        const osc = audioCtx.createOscillator();
        const cGain = audioCtx.createGain();
        const now = audioCtx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        cGain.gain.setValueAtTime(0, now);
        cGain.gain.linearRampToValueAtTime(0.15, now + 0.03);
        cGain.gain.linearRampToValueAtTime(0, now + 2.0);
        osc.connect(cGain);
        cGain.connect(outGain);
        osc.start(now);
        osc.stop(now + 2.1);
      } catch {}
    }, 2600);

    intervalTimers.push(chimeTimer);
    activeNodes.push({ source: wind, gainNode: trackGain }, { source: lfo });
  }

  // 4. 🪵 暖阁柴火 (Cozy Fireplace)
  function synthesizeFireplace(audioCtx, outGain) {
    const lowBuffer = createNoiseBuffer(audioCtx, 'pink');
    const lowNoise = audioCtx.createBufferSource();
    lowNoise.buffer = lowBuffer;
    lowNoise.loop = true;

    const lowFilter = audioCtx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.setValueAtTime(160, audioCtx.currentTime);

    const trackGain = audioCtx.createGain();
    trackGain.gain.setValueAtTime(0, audioCtx.currentTime);
    trackGain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.5);

    lowNoise.connect(lowFilter);
    lowFilter.connect(trackGain);
    trackGain.connect(outGain);
    lowNoise.start();

    // 随机噼啪木柴爆裂声
    const crackleTimer = setInterval(() => {
      if (!isPlaying) return;
      try {
        const burstCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burstCount; i++) {
          setTimeout(() => {
            if (!isPlaying) return;
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const cGain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(90 + Math.random() * 220, now);
            cGain.gain.setValueAtTime(0.18, now);
            cGain.gain.linearRampToValueAtTime(0, now + 0.03);
            osc.connect(cGain);
            cGain.connect(outGain);
            osc.start(now);
            osc.stop(now + 0.035);
          }, i * 35);
        }
      } catch {}
    }, 280);

    intervalTimers.push(crackleTimer);
    activeNodes.push({ source: lowNoise, gainNode: trackGain });
  }

  // 5. 🎐 静夜禅钟 (Midnight Zen Bell / Singing Bowl)
  function synthesizeZenBell(audioCtx, outGain) {
    const droneOsc1 = audioCtx.createOscillator();
    const droneOsc2 = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();

    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(108, audioCtx.currentTime);
    droneOsc2.type = 'sine';
    droneOsc2.frequency.setValueAtTime(216.5, audioCtx.currentTime);

    droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 1.0);

    droneOsc1.connect(droneGain);
    droneOsc2.connect(droneGain);
    droneGain.connect(outGain);

    droneOsc1.start();
    droneOsc2.start();

    function strikeBowl() {
      if (!isPlaying) return;
      try {
        const now = audioCtx.currentTime;
        const fundamental = 261.63;
        const harmonics = [1, 2.76, 5.40];

        harmonics.forEach((ratio, idx) => {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(fundamental * ratio, now);
          const amp = 0.22 / (idx + 1);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(amp, now + 0.04);
          g.gain.linearRampToValueAtTime(0, now + 5.0 + idx * 0.8);
          osc.connect(g);
          g.connect(outGain);
          osc.start(now);
          osc.stop(now + 6.0);
        });
      } catch {}
    }

    strikeBowl();
    const bowlTimer = setInterval(strikeBowl, 7000);

    intervalTimers.push(bowlTimer);
    activeNodes.push({ source: droneOsc1, gainNode: droneGain }, { source: droneOsc2 });
  }

  // 6. 🌌 星海幽梦 (Cosmic Dream Drone)
  function synthesizeAbyss(audioCtx, outGain) {
    const pad1 = audioCtx.createOscillator();
    const pad2 = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();

    pad1.type = 'sawtooth';
    pad1.frequency.setValueAtTime(65.41, audioCtx.currentTime);
    pad2.type = 'triangle';
    pad2.frequency.setValueAtTime(98.00, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, audioCtx.currentTime);

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.06, audioCtx.currentTime);

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(120, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    padGain.gain.setValueAtTime(0, audioCtx.currentTime);
    padGain.gain.linearRampToValueAtTime(0.38, audioCtx.currentTime + 1.2);

    pad1.connect(filter);
    pad2.connect(filter);
    filter.connect(padGain);
    padGain.connect(outGain);

    pad1.start();
    pad2.start();
    lfo.start();

    activeNodes.push({ source: pad1, gainNode: padGain }, { source: pad2 }, { source: lfo });
  }

  function playTrack(trackId) {
    const audioCtx = getContext();
    if (!audioCtx) return;

    stopCurrentTrack(0.2);
    currentTrackId = trackId;
    isPlaying = true;

    setTimeout(() => {
      if (!isPlaying) return;
      if (trackId === 'rain') synthesizeRain(audioCtx, masterGain);
      else if (trackId === 'forest') synthesizeForest(audioCtx, masterGain);
      else if (trackId === 'fireplace') synthesizeFireplace(audioCtx, masterGain);
      else if (trackId === 'bell') synthesizeZenBell(audioCtx, masterGain);
      else if (trackId === 'abyss') synthesizeAbyss(audioCtx, masterGain);
      else synthesizeRipple(audioCtx, masterGain);
    }, 50);

    updateUI();
    saveState();
  }

  function toggle() {
    if (isPlaying) {
      stop();
    } else {
      play(currentTrackId);
    }
  }

  function play(trackId) {
    if (trackId) currentTrackId = trackId;
    playTrack(currentTrackId);
  }

  function stop() {
    isPlaying = false;
    stopCurrentTrack(0.3);
    updateUI();
    saveState();
  }

  function setVolume(vol) {
    const audioCtx = getContext();
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), audioCtx.currentTime);
    }
    if (typeof state !== 'undefined') {
      state.ambientVolume = vol;
      if (typeof persist === 'function') persist();
    }
  }

  function updateUI() {
    const btn = document.getElementById('soundBtn');
    if (!btn) return;
    const cur = TRACKS.find(t => t.id === currentTrackId) || TRACKS[0];
    btn.classList.toggle('active', isPlaying);
    btn.innerHTML = isPlaying ? `<span class="sound-playing-icon">${cur.icon}</span> <span>${cur.name}</span> <span class="eq-bars"><i></i><i></i><i></i></span>` : `📻 环境音`;
    btn.title = isPlaying ? `正在播放：${cur.name} (点击打开选曲留声机)` : `点击打开圣域留声机选曲`;
  }

  function saveState() {
    if (typeof state !== 'undefined') {
      state.ambientPlaying = isPlaying;
      state.ambientTrack = currentTrackId;
      if (typeof persist === 'function') persist();
    }
  }

  function playDeliveryChime() {
    try {
      const audioCtx = getContext();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      const startTime = audioCtx.currentTime;
      notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + index * 0.12);

        gain.gain.setValueAtTime(0, startTime + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.28, startTime + index * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(startTime + index * 0.12);
        osc.stop(startTime + index * 0.12 + 0.65);
      });
    } catch (e) {}
  }

  return {
    getTracks: () => TRACKS,
    getCurrentTrack: () => TRACKS.find(t => t.id === currentTrackId) || TRACKS[0],
    isPlaying: () => isPlaying,
    play,
    stop,
    toggle,
    setVolume,
    updateUI,
    playDeliveryChime,
    init: () => {
      if (typeof state !== 'undefined' && state.ambientTrack) {
        currentTrackId = state.ambientTrack;
      }
      updateUI();
    }
  };
})();
