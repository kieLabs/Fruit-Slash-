export class AudioManager {
  constructor(settings = {}) {
    this.settings = settings; this.ctx = null; this.musicTimer = null; this.noteIndex = 0;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(()=>{});
  }
  tone(frequency, duration = .08, type = 'sine', volume = .12, endFrequency = frequency) {
    if (!this.settings.sound || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(1,endFrequency), now + duration);
    gain.gain.setValueAtTime(volume * (this.settings.effectsVolume ?? .75) * (this.settings.masterVolume ?? .65), now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now + duration + .02);
  }
  slice(combo = 1) { this.tone(420 + Math.min(combo,7)*55, .1, 'triangle', .1, 950 + combo*50); }
  launch() { this.tone(160, .12, 'sine', .035, 320); }
  combo(count) { this.tone(520 + count*65, .22, 'sine', .13, 950 + count*50); }
  bomb() { this.tone(95, .4, 'sawtooth', .22, 35); }
  click() { this.tone(620, .045, 'sine', .045, 760); }
  complete() { [523,659,784].forEach((f,i)=>setTimeout(()=>this.tone(f,.24,'sine',.12,f*1.05),i*110)); }
  gameOver() { this.tone(280,.5,'triangle',.14,90); }
  setSettings(settings) { this.settings = settings; }
  startMusic() {
    if (!this.settings.music || this.musicTimer) return;
    const notes = [261.6,329.6,392,329.6,293.7,349.2,440,349.2];
    this.musicTimer = setInterval(() => {
      if (!this.settings.music || !this.ctx) return;
      const f = notes[this.noteIndex++ % notes.length];
      const now = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.setValueAtTime(.0001,now); gain.gain.linearRampToValueAtTime(.018*(this.settings.musicVolume??.35)*(this.settings.masterVolume??.65),now+.04);
      gain.gain.exponentialRampToValueAtTime(.0001,now+.38); osc.connect(gain); gain.connect(this.ctx.destination); osc.start(now); osc.stop(now+.4);
    }, 430);
  }
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer = null; }
}
