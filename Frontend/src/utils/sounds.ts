import type { NotificationSettingsDto } from "../types/api";

type AudioContextType = typeof AudioContext;

// Notification sound types
export enum NotificationSoundType {
  Ding = "ding",
  DoubleBeep = "double-beep",
  TripleTone = "triple-tone",
  Swoosh = "swoosh",
  Ping = "ping",
  Chime = "chime",
  Bell = "bell",
  Pop = "pop",
  Bubble = "bubble",
  Alert = "alert",
}

export const SOUND_NAMES: Record<NotificationSoundType, string> = {
  [NotificationSoundType.Ding]: "Ding (Simple)",
  [NotificationSoundType.DoubleBeep]: "Double Beep",
  [NotificationSoundType.TripleTone]: "Triple Tone",
  [NotificationSoundType.Swoosh]: "Swoosh",
  [NotificationSoundType.Ping]: "Ping",
  [NotificationSoundType.Chime]: "Chime",
  [NotificationSoundType.Bell]: "Bell",
  [NotificationSoundType.Pop]: "Pop",
  [NotificationSoundType.Bubble]: "Bubble",
  [NotificationSoundType.Alert]: "Alert",
};

// Global AudioContext that will be resumed on user interaction
let globalAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!globalAudioContext) {
    try {
      const Ctx = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioContextType }).webkitAudioContext) as AudioContextType;
      globalAudioContext = new Ctx();
    } catch {
      return null;
    }
  }
  return globalAudioContext;
}

// Resume AudioContext if it's suspended (required by browser autoplay policy)
async function ensureAudioContextRunning(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
      console.log("✅ AudioContext resumed");
    } catch (err) {
      console.error("❌ Failed to resume AudioContext:", err);
      return false;
    }
  }
  return true;
}

// Initialize AudioContext on first user interaction
function initAudioOnUserGesture() {
  const events = ["click", "touchstart", "keydown"];
  const handler = async () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Only try to resume if suspended
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
        console.log("✅ AudioContext resumed on user gesture, state:", ctx.state);
      } catch (err) {
        console.error("❌ Failed to resume on user gesture:", err);
        return; // Don't remove listener if failed
      }
    }

    // Only remove listeners when AudioContext is actually running
    if (ctx.state === "running") {
      console.log("✅ AudioContext is running, removing gesture listeners");
      events.forEach((event) => document.removeEventListener(event, handler));
    }
  };
  // Don't use { once: true } - let handler decide when to remove itself
  events.forEach((event) => document.addEventListener(event, handler));
}

// Initialize on module load
initAudioOnUserGesture();

/** Get notification preferences - to be removed, use settings from Redux store */
export function getNotificationPrefs() {
  try {
    const saved = localStorage.getItem("notificationPrefs");
    return saved ? JSON.parse(saved) : { messages: true, sound: true, preview: true, groups: true, mentions: true };
  } catch {
    return { messages: true, sound: true, preview: true, groups: true, mentions: true };
  }
}

// ==================== Sound Generators ====================

/** 1. Ding (Simple) - Classic notification sound */
function playSoundDing(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.28, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.38);
}

/** 2. Double Beep - Two quick beeps */
function playSoundDoubleBeep(ctx: AudioContext) {
  [0, 0.15].forEach((delay) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.12);
  });
}

/** 3. Triple Tone - Three ascending notes */
function playSoundTripleTone(ctx: AudioContext) {
  [600, 750, 900].forEach((freq, i) => {
    const delay = i * 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.22, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.18);
  });
}

/** 4. Swoosh - Frequency sweep */
function playSoundSwoosh(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.32);
}

/** 5. Ping - High pitched quick tone */
function playSoundPing(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.value = 1200;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.18);
}

/** 6. Chime - Soft bell-like sound */
function playSoundChime(ctx: AudioContext) {
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const delay = i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.55);
  });
}

/** 7. Bell - Classic bell sound */
function playSoundBell(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.65);
}

/** 8. Pop - Quick pop sound */
function playSoundPop(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

/** 9. Bubble - Bubbly playful sound */
function playSoundBubble(ctx: AudioContext) {
  [600, 900, 700].forEach((freq, i) => {
    const delay = i * 0.05;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.12);
  });
}

/** 10. Alert - Urgent attention sound */
function playSoundAlert(ctx: AudioContext) {
  [700, 900, 700].forEach((freq, i) => {
    const delay = i * 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.12);
  });
}

/** Play a specific notification sound type */
export async function playNotificationSound(
  soundType: NotificationSoundType = NotificationSoundType.Ding,
): Promise<void> {
  const isRunning = await ensureAudioContextRunning();
  if (!isRunning) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    switch (soundType) {
      case NotificationSoundType.Ding:
        playSoundDing(ctx);
        break;
      case NotificationSoundType.DoubleBeep:
        playSoundDoubleBeep(ctx);
        break;
      case NotificationSoundType.TripleTone:
        playSoundTripleTone(ctx);
        break;
      case NotificationSoundType.Swoosh:
        playSoundSwoosh(ctx);
        break;
      case NotificationSoundType.Ping:
        playSoundPing(ctx);
        break;
      case NotificationSoundType.Chime:
        playSoundChime(ctx);
        break;
      case NotificationSoundType.Bell:
        playSoundBell(ctx);
        break;
      case NotificationSoundType.Pop:
        playSoundPop(ctx);
        break;
      case NotificationSoundType.Bubble:
        playSoundBubble(ctx);
        break;
      case NotificationSoundType.Alert:
        playSoundAlert(ctx);
        break;
    }
  } catch (err) {
    console.error("❌ Error playing notification sound:", err);
  }
}

/** Short "ding" sound for incoming messages */
export async function playMessageSound(
  notificationSettings?: NotificationSettingsDto,
  soundType: NotificationSoundType = NotificationSoundType.Ding,
): Promise<void> {
  console.log("🔔 playMessageSound called");
  console.log("   Settings:", notificationSettings);
  console.log("   Sound enabled?", notificationSettings?.sound ?? "undefined");
  console.log("   Sound type:", soundType);

  // Check if sound is enabled
  if (notificationSettings && !notificationSettings.sound) {
    console.log("🔇 Sound is disabled in settings");
    return;
  }

  await playNotificationSound(soundType);
}

/** Two-note ascending chime for friend requests */
export async function playFriendRequestSound(
  notificationSettings?: NotificationSettingsDto,
  soundType: NotificationSoundType = NotificationSoundType.Chime,
): Promise<void> {
  // Check if sound is enabled
  if (notificationSettings && !notificationSettings.sound) return;

  await playNotificationSound(soundType);
}
