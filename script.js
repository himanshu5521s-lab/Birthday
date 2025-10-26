/* script.js
   - 3-second countdown with cute hearts background
   - After countdown: reveal main stage, show HAPPY BIRTHDAY popup + confetti
   - Card flips on click; diary cover "page-turn" reveals compliments (2c)
   - Music: synthesized "Happy Birthday" melody via Web Audio API (loops)
   - If autoplay blocked, a play button appears
*/

(() => {
  const COUNT = 3; // 3 seconds
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

  // --- Hearts background creation ---
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
    // dynamic keyframes
    const s = document.createElement('style');
    s.textContent = `
    @keyframes rise {
      0% { transform: translateY(0) rotate(0deg) scale(0.9); opacity:0;}
      10%{opacity:1;}
      100% { transform: translateY(-120vh) rotate(360deg) scale(1.2); opacity:0;}
    }`;
    document.head.appendChild(s);
  })();

  // --- Countdown ---
  (function countdown() {
    let t = COUNT;
    countNumber.textContent = t;
    const id = setInterval(() => {
      t--;
      if (t <= 0) {
        clearInterval(id);
        // fade overlay
        overlay.style.transition = 'opacity .45s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 600);
        revealMain();
      } else {
        // little pop animation
        countNumber.classList.remove('popme');
        void countNumber.offsetWidth;
        countNumber.classList.add('popme');
        countNumber.textContent = t;
      }
    }, 1000);
  })();

  // --- Reveal main stage and show popup + play music ---
  function revealMain() {
    mainStage.classList.remove('hidden');
    mainStage.removeAttribute('aria-hidden');

    // show popup & confetti
    popup.classList.remove('hidden');
    popup.classList.add('show');
    popup.removeAttribute('aria-hidden');

    // start confetti
    startConfetti();

    // hide popup after 5.5s
    setTimeout(() => {
      popup.classList.remove('show');
      popup.classList.add('hidden');
      stopConfetti();
    }, 5500);

    // attempt to play music
    tryStartMusic();
  }

  // --- Card flip and diary page-turn ---
  card.addEventListener('click', () => {
    if (card.classList.contains('opened')) return;
    card.classList.add('opened');
    setTimeout(() => {
      // reveal turn button and show diary cover -> page-turn only after pressing turn
      turnBtn.classList.remove('hidden');
      turnBtn.setAttribute('aria-hidden', 'false');
    }, 900);
  });

  turnBtn.addEventListener('click', () => {
    // animate cover disappears and page turns in
    diaryCover.style.transition = 'transform .7s ease, opacity .6s';
    diaryCover.style.transform = 'translateX(-40px) rotate(-8deg)';
    diaryCover.style.opacity = '0';
    setTimeout(() => {
      diaryCover.style.display = 'none';
      page.classList.add('open'); // page-turn reveal
      page.setAttribute('aria-hidden', 'false');
      turnBtn.classList.add('hidden');
    }, 600);
  });

  // --- Confetti (simple particle) ---
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

    spawnBurst();
    spawnBurst();
    if (!confettiAnim) confettiAnim = requestAnimationFrame(loop);
    // spawn a couple more bursts for richness
    let extra = 3;
    const t = setInterval(() => {
      spawnBurst();
      extra--; if (extra <= 0) clearInterval(t);
    }, 500);

    addEventListener('resize', () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; });
  }

  function stopConfetti() {
    if (confettiAnim) { cancelAnimationFrame(confettiAnim); confettiAnim = null; const ctx = confettiCanvas.getContext('2d'); ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
  }

  // --- Music: synth Happy Birthday melody (looping) via WebAudio ---
  let audioCtx, masterGain, isPlaying = false, loopId = null;
  // melody as array of [midiNote, durationBeats], using 120bpm baseline
  // Simple melody approximation (notes in MIDI numbers)
  const melody = [
    [64, 0.75], [64, 0.25], [66, 1], [64, 1], [69, 1], [68, 2], // "Happy birthday to you"
    [64, 0.75], [64, 0.25], [66, 1], [64, 1], [71, 1], [69, 2], // "Happy birthday to you"
    [64, 0.75], [64, 0.25], [76, 1], [72, 1], [69, 1], [68, 1], [66, 1], // "Happy birthday dear [name]"
    [74, 0.75], [74, 0.25], [72, 1], [69, 1], [71, 1], [69, 2] // "Happy birthday to you"
  ];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function startSynth() {
    if (isPlaying) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.12; // gentle volume
    masterGain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    let t = now + 0.1;
    const bpm = 92; // slower, gentle
    const beat = 60 / bpm;

    // schedule melody loop (will be re-scheduled to loop)
    function schedule(startTime) {
      let time = startTime;
      for (let i = 0; i < melody.length; i++) {
        const [note, dur] = melody[i];
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = midiToFreq(note);
        env.gain.value = 0;
        osc.connect(env); env.connect(masterGain);
        osc.start(time);
        // envelope
        env.gain.linearRampToValueAtTime(1.0, time + 0.01);
        env.gain.linearRampToValueAtTime(0.0001, time + dur * beat - 0.02);
        osc.stop(time + dur * beat + 0.05);
        time += dur * beat;
      }
      // return total length
      return time - startTime;
    }

    // schedule repeating loop
    const loopLen = schedule(t);
    // set up an interval to reschedule slightly before loop ends
    loopId = setInterval(() => {
      // schedule again after a small gap
      schedule(audioCtx.currentTime + 0.1);
    }, Math.max(4000, loopLen * 1000 - 500));

    isPlaying = true;
  }

  function stopSynth() {
    if (loopId) { clearInterval(loopId); loopId = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    isPlaying = false;
  }

  // Try to start music; if autoplay blocked, show fallback button
  async function tryStartMusic() {
    try {
      startSynth();
      // browsers often require a user gesture; check state
      if (audioCtx && audioCtx.state === 'suspended') {
        // will show fallback
        throw new Error('suspended');
      }
    } catch (e) {
      // show fallback play button
      playFallback.classList.remove('hidden');
      playFallback.addEventListener('click', async () => {
        try {
          startSynth();
          playFallback.classList.add('hidden');
        } catch (err) {
          alert('Playback failed — your browser may block sound.');
        }
      });
    }
  }

  // If user leaves page, stop synth & confetti
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopSynth(); stopConfetti(); }
  });
})();
