/* Soft generative wedding music: tanpura-style drone + Raag Bhupali melody, synthesized live (no audio file). */
window.WeddingMusic = (() => {
  let ctx, master, verb, timer, playing = false, nextBeat = 0, step = 0, phrase = [], pi = 0;
  const SA = 293.66; // D4
  // Bhupali: S R G P D (semitones 0 2 4 7 9)
  const scale = [-5, -3, 0, 2, 4, 7, 9, 12, 14, 16];
  const phrases = [
    [2, 3, 4, 3, 2, null, 1, 2], [4, 5, 6, 5, 4, 3, 2, null], [6, 7, 6, 5, 4, null, 3, 4],
    [2, null, 3, 4, 5, 4, 3, 2], [7, 6, 5, 4, 3, 2, 1, null], [0, 1, 2, null, 3, 2, 2, null],
    [4, 4, 5, 6, 7, null, 6, 5], [3, 2, 1, 0, 1, 2, null, null]
  ];
  const BEAT = 0.42;
  const hz = s => SA * Math.pow(2, s / 12);

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    // simple generated reverb
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 3, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.45;
    verb.connect(wet).connect(master);
    master.connect(ctx.destination);
  }

  function pluck(freq, t, dur, vol, bright) {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vol, t + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright;
    [[1, 1], [2, .35], [3, .15], [4.01, .08]].forEach(([m, a]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = m === 1 ? 'triangle' : 'sine'; o.frequency.value = freq * m; g.gain.value = a;
      o.connect(g).connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
    lp.connect(out); out.connect(master); out.connect(verb);
  }

  function schedule() {
    while (nextBeat < ctx.currentTime + 0.3) {
      const b = step % 16;
      // tanpura cycle: Pa (low), Sa, Sa, Sa (low) every 4 beats
      if (step % 2 === 0) {
        const tn = [hz(-5), hz(0), hz(0), hz(-12)][(step / 2) % 4];
        pluck(tn, nextBeat, 3.2, 0.10, 1400);
      }
      // melody: one phrase per 8 beats, rest every 4th phrase
      if (pi >= phrase.length) { phrase = Math.random() < .2 ? new Array(8).fill(null) : phrases[Math.random() * phrases.length | 0]; pi = 0; }
      const n = phrase[pi++];
      if (n != null) pluck(hz(scale[n]) * 2, nextBeat, 1.8, 0.13, 3200);
      if (b === 0 && Math.random() < .5) pluck(hz(12) * 2, nextBeat + BEAT / 2, 2.4, 0.04, 5000); // shimmer
      nextBeat += BEAT; step++;
    }
  }

  function play() {
    if (!ctx) init();
    ctx.resume();
    if (playing) return;
    playing = true;
    nextBeat = ctx.currentTime + 0.1;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);
    timer = setInterval(schedule, 100); schedule();
  }
  function pause() {
    if (!ctx || !playing) return;
    playing = false; clearInterval(timer);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }
  return { play, pause, toggle() { playing ? pause() : play(); return playing; }, get playing() { return playing; } };
})();
