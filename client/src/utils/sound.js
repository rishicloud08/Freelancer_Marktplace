// Web Audio API Sound Synthesizer (Instant playback without external audio files)
class SoundPlayer {
  constructor() {
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Melodic 4-note ascending chime for incoming proposals: C5 -> E5 -> G5 -> C6
  playProposalChime() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const chord = [
        { freq: 523.25, time: 0 },       // C5
        { freq: 659.25, time: 0.09 },    // E5
        { freq: 783.99, time: 0.18 },    // G5
        { freq: 1046.50, time: 0.27 }    // C6 (bright finale)
      ];

      chord.forEach(({ freq, time }) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.4, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + 0.6);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.65);
      });
    } catch (e) {
      console.warn('Audio playback not allowed or supported:', e);
    }
  }

  // Gentle pop sound for instant messaging
  playMessagePing() {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }
}

export const soundPlayer = new SoundPlayer();
export default soundPlayer;
