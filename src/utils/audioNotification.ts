// Utility for creating notification sounds using Web Audio API
export class AudioNotification {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a short notification beep sound
   * @param frequency - The frequency of the beep (default: 800Hz)
   * @param duration - Duration in milliseconds (default: 200ms)
   * @param volume - Volume between 0 and 1 (default: 0.3)
   */
  public playNotificationBeep(frequency: number = 800, duration: number = 200, volume: number = 0.3): void {
    try {
      const ctx = this.getAudioContext();
      
      // Resume audio context if it's suspended (required by browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Create a smooth envelope to avoid clicking sounds
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
      
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
      
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  /**
   * Play a pleasant two-tone notification
   */
  public playTwoToneNotification(): void {
    this.playNotificationBeep(600, 150, 0.2);
    setTimeout(() => {
      this.playNotificationBeep(800, 150, 0.2);
    }, 100);
  }
}

// Export a singleton instance
export const audioNotification = new AudioNotification();