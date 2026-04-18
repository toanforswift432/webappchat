import { useEffect, useRef } from 'react';

type RingtoneType = 'incoming-audio' | 'incoming-video' | 'ringback';

function buildRingPattern(ctx: AudioContext, type: RingtoneType) {
  const INTERVAL_MS = type === 'ringback' ? 4000 : 2000;

  function playBeep(startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'incoming-audio') {
      // Classic phone: two short beeps (440 Hz)
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.setValueAtTime(0.35, startTime + 0.18);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 440;
      gain2.gain.setValueAtTime(0, startTime + 0.35);
      gain2.gain.linearRampToValueAtTime(0.35, startTime + 0.37);
      gain2.gain.setValueAtTime(0.35, startTime + 0.53);
      gain2.gain.linearRampToValueAtTime(0, startTime + 0.55);
      osc2.start(startTime + 0.35);
      osc2.stop(startTime + 0.6);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    } else if (type === 'incoming-video') {
      // FaceTime style: ascending two-tone (520 + 660 Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, startTime);
      osc.frequency.linearRampToValueAtTime(660, startTime + 0.15);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
      gain.gain.setValueAtTime(0.3, startTime + 0.55);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.6);
      osc.start(startTime);
      osc.stop(startTime + 0.65);
    } else {
      // Ringback: standard 425 Hz, 1s on
      osc.type = 'sine';
      osc.frequency.value = 425;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.setValueAtTime(0.2, startTime + 0.95);
      gain.gain.linearRampToValueAtTime(0, startTime + 1.0);
      osc.start(startTime);
      osc.stop(startTime + 1.05);
    }
  }

  return { playBeep, intervalMs: INTERVAL_MS };
}

export function useCallAudio(active: boolean, type: RingtoneType) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      return;
    }

    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    ctxRef.current = ctx;

    const { playBeep, intervalMs } = buildRingPattern(ctx, type);

    // Play immediately then on interval
    playBeep(ctx.currentTime);
    timerRef.current = setInterval(() => {
      if (ctxRef.current) playBeep(ctxRef.current.currentTime);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      ctx.close().catch(() => {});
      ctxRef.current = null;
    };
  }, [active, type]);
}
