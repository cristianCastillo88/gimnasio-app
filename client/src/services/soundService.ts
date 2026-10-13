// Servicio de síntesis de audio nativo mediante Web Audio API (Cero archivos externos, 100% offline)

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {
        // User gesture needed
      });
    }

    return this.audioCtx;
  }

  /**
   * Programa una campana en el reloj de hardware de Web Audio API para sonar con precisión
   * incluso si el navegador throttles o congela setInterval en segundo plano / pantalla apagada.
   * Retorna una función para cancelar la programación si el usuario detiene o pausa el temporizador.
   */
  public scheduleRestEndBell(delaySeconds: number): () => void {
    const ctx = this.getAudioContext();
    if (!ctx || delaySeconds <= 0) return () => {};

    try {
      const targetTime = ctx.currentTime + delaySeconds;
      const frequencies = [880, 1760]; // La5 y armónico metálico
      const nodes: { osc: OscillatorNode; gain: GainNode }[] = [];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, targetTime);

        const initialGain = idx === 0 ? 0.35 : 0.15;
        // Mute inicial hasta el momento exacto programado
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(initialGain, targetTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, targetTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(targetTime);
        osc.stop(targetTime + 1.2);

        nodes.push({ osc, gain });
      });

      let cancelled = false;
      return () => {
        if (cancelled) return;
        cancelled = true;
        nodes.forEach(({ osc, gain }) => {
          try {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
          } catch {
            // Ya finalizado o limpiado
          }
        });
      };
    } catch {
      return () => {};
    }
  }

  /**
   * Reproduce una campana de gimnasio / boxeo con decaimiento armónico para avisar el fin del descanso.
   */
  public playRestEndBell(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Frecuencia fundamental y armónico para sonido metálico de campana
      const frequencies = [880, 1760]; // La5 y armónico agudo

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);

        // Volumen inicial y decaimiento exponencial
        const initialGain = idx === 0 ? 0.35 : 0.15;
        gain.gain.setValueAtTime(initialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });
    } catch {
      // Audio playback restricted by browser policy
    }
  }

  /**
   * Tono corto de confirmación al registrar una serie.
   */
  public playSetCompletedTone(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5 (Arpeggio rápido ascendente)

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio policy safe fallback
    }
  }
}

export const soundService = new SoundService();
