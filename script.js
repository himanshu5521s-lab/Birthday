(() => {
  const COUNT = 3; // Countdown seconds
  const overlay = document.getElementById('countdownOverlay');
  const countNumber = document.getElementById('countNumber');
  const mainStage = document.getElementById('mainStage');
  const popup = document.getElementById('revealPopup');
  const playFallback = document.getElementById('playFallback');
  const confettiCanvas = document.getElementById('confetti');

  const card = document.getElementById('card');
  const diaryCover = document.getElementById('diaryCover');
  const page = document.getElementById('page');
  const turnBtn = document.getElementById('turnBtn');

  // --- Hearts background ---
  (function makeHearts() {
    const container = document.querySelector('.hearts-bg');
    if (!container) return;
    const total = 22;
    for (let i = 0; i < total; i++) {
      const el = document.createElement('div');
      el.className = 'heart';
      const size = 12 + Math.random() * 36;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = Math.random() * 100 + '%';
      el.style.bottom = -60 - Math.random() * 120 + 'px';
      el.style.opacity = 0.7 + Math.random() * 0.3;
      const delay = Math.random() * 1.2;
      const dur = 4 + Math.random() * 5;
      el.style.animation = `rise ${dur}s linear ${delay}s infinite`;
      container.appendChild(el);
    }
    const s = document.createElement('style');
    s.textContent = `
    @keyframes rise {
      0% { transform: translateY(0) rotate(0deg) scale(0.9); opacity:0;}
      10%{opacity:1;}
      100% { transform: translateY(-120vh) rotate(360deg) scale(1.2); opacity:0;}
    }`;
    document.head.appendChild(s);
  })();

  // --- Confetti ---
  let confettiAnim = null;
  function startConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;
    const pieces = [];

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function spawnBurst() {
      const cx = W * (0.2 + Math.random() * 0.6);
      const cy = H * (0.25 + Math.random() * 0.35);
      const count = 70;
      for (let i = 0; i < count; i++) {
        pieces.push({
          x: cx,
          y: cy,
          vx: rand(-6, 6),
          vy: rand(-10, -2),
          size: rand(6, 13),
          color: `hsl(${rand(300, 360)},70%,60%)`
        });
      }
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.25;
        p.vx *= 0.998;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.rect(p.x, p.y, p.size, p.size * 0.6);
        ctx.fill();
        if (p.y > H + 50) pieces.splice(i, 1);
      }
      confettiAnim = requestAnimationFrame(loop);
    }

    spawnBurst(); spawnBurst();
    let extra = 3;
    const t = setInterval(() => {
      spawnBurst();
      extra--; if (extra <= 0) clearInterval(t);
    }, 500);

    confettiAnim = requestAnimationFrame(loop);
    addEventListener('resize', () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; });
  }
  function stopConfetti() {
    if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; const ctx = confettiCanvas.getContext('2d'); ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
  }

  // --- Music (Web Audio API) ---
  let audioCtx, masterGain, isPlaying = false, loopId = null;
  const melody = [
    [64, 0.75], [64, 0.25], [66, 1], [64, 1], [69, 1], [68, 2],
    [64, 0.75], [64, 0.25], [66, 1], [64, 1], [71, 1], [69, 2],
    [64, 0.75], [64, 0.25], [76, 1], [72, 1], [69, 1], [68, 1], [66, 1],
    [74, 0.75], [74, 0.25], [72, 1], [69, 1], [71, 1], [69, 2]
  ];
  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function startSynth() {
    if (isPlaying) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.12;
    masterGain.connect(audioCtx.destination);

    const bpm = 92;
    const beat = 60 / bpm;

    function schedule(startTime) {
      let time = startTime;
      for (let i = 0; i < melody.length; i++) {
        const [note, dur] = melody[i];
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = midiToFreq(note);
        env.gain.value = 0;
        osc.connect(env); env.connect(masterGain);
        osc.start(time);
        env.gain.linearRampToValueAtTime(1, time + 0.01);
        env.gain.linearRampToValueAtTime(0.0001, time + dur * beat - 0.02);
        osc.stop(time + dur * beat + 0.05);
        time += dur * beat;
      }
      return time - startTime;
    }

    const loopLen = schedule(audioCtx.currentTime + 0.1);
    loopId = setInterval(() => { schedule(audioCtx.currentTime + 0.1); }, Math.max(4000, loopLen * 1000 - 500));
    isPlaying = true;
  }
  function stopSynth() {
    if (loopId) { clearInterval(loopId); loopId = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    isPlaying = false;
  }
  async function tryStartMusic() {
    try {
      startSynth();
      if (audioCtx && audioCtx.state === 'suspended') throw new Error('suspended');
    } catch (e) {
      playFallback.classList.remove('hidden');
      playFallback.addEventListener('click', () => { startSynth(); playFallback.classList.add('hidden'); });
    }
  }

  // --- Card flip ---
  card.addEventListener('click', () => {
    if (card.classList.contains('opened')) return;
    card.classList.add('opened');
    setTimeout(() => {
      turnBtn.classList.remove('hidden');
      turnBtn.setAttribute('aria-hidden', 'false');
    }, 900);
  });

  // --- Diary page-turn ---
  turnBtn.addEventListener('click', () => {
    diaryCover.style.transition = 'transform .7s ease, opacity .6s';
    diaryCover.style.transform = 'translateX(-40px) rotate(-8deg)';
    diaryCover.style.opacity = '0';
    setTimeout(() => {
      diaryCover.style.display = 'none';
      page.classList.add('open');
      page.setAttribute('aria-hidden', 'false');
      turnBtn.classList.add('hidden');
    }, 600);
  });

  // --- Countdown ---
  function startCountdown() {
    let t = COUNT;
    countNumber.textContent = t;
    const id = setInterval(() => {
      t--;
      if (t <= 0) {
        clearInterval(id);
        overlay.style.transition = 'opacity .45s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
        revealPopup();
      } else {
        countNumber.classList.remove('popme');
        void countNumber.offsetWidth;
        countNumber.classList.add('popme');
        countNumber.textContent = t;
      }
    }, 1000);
  }

  // --- Reveal popup + confetti ---
  function revealPopup() {
    mainStage.classList.remove('hidden');
    mainStage.removeAttribute('aria-hidden');

    popup.classList.remove('hidden');
    popup.classList.add('show');
    popup.removeAttribute('aria-hidden');

    startConfetti();
    setTimeout(() => {
      popup.classList.remove('show');
      popup.classList.add('hidden');
      stopConfetti();
    }, 5500);
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    tryStartMusic();  // Play music immediately
    startCountdown();  // Start hearts countdown
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopSynth(); stopConfetti(); }
  });
})();
