// Servicio de retroalimentación háptica mediante Vibration API

class HapticsService {
  private hasVibrationSupport(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  }

  /**
   * Pulso sutil de 20ms para botones e inputs.
   */
  public vibrateLight(): void {
    if (!this.hasVibrationSupport()) return;
    try {
      navigator.vibrate(20);
    } catch {
      // Ignorar restricciones del navegador
    }
  }

  /**
   * Pulso doble táctil para confirmación de serie completada [40ms, 30ms pausa, 40ms].
   */
  public vibrateSetComplete(): void {
    if (!this.hasVibrationSupport()) return;
    try {
      navigator.vibrate([40, 30, 40]);
    } catch {
      // Ignorar restricciones
    }
  }

  /**
   * Patrón de alarma para fin de tiempo de descanso [120ms, 60ms pausa, 120ms, 60ms pausa, 250ms].
   */
  public vibrateTimerEnd(): void {
    if (!this.hasVibrationSupport()) return;
    try {
      navigator.vibrate([120, 60, 120, 60, 250]);
    } catch {
      // Ignorar restricciones
    }
  }
}

export const hapticsService = new HapticsService();
