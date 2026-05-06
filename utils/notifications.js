// utils/notifications.js — Daily habit reminder notifications

const Notifications = {
  ENABLED_KEY: 'jrpg-notif-enabled',
  TIME_KEY:    'jrpg-notif-time',

  MESSAGES: [
    { title: '⚔️ Hora de progredir, Viajante!',  body: 'Registre seus hábitos de hoje e ganhe XP!' },
    { title: '🌟 Sua jornada continua...',         body: 'Não deixe o streak morrer! Faça algo incrível hoje.' },
    { title: '📜 Nova missão aguarda',             body: 'Verifique suas missões diárias e evolua suas habilidades.' },
    { title: '🔥 Mantenha o Streak aceso!',        body: 'Cada dia conta. Registre uma atividade agora.' },
    { title: '🏆 Destino: Nível Máximo',           body: 'Um pequeno hábito hoje = grande progresso amanhã.' },
  ],

  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  isEnabled() {
    return localStorage.getItem(this.ENABLED_KEY) === 'true'
      && 'Notification' in window
      && Notification.permission === 'granted';
  },

  getTime() {
    return localStorage.getItem(this.TIME_KEY) || '08:00';
  },

  async enable(time) {
    if (!this.isSupported()) return { ok: false, reason: 'Não suportado neste navegador.' };
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: 'Permissão negada pelo navegador.' };
    localStorage.setItem(this.ENABLED_KEY, 'true');
    if (time) localStorage.setItem(this.TIME_KEY, time);
    await this._schedule();
    return { ok: true };
  },

  disable() {
    localStorage.setItem(this.ENABLED_KEY, 'false');
  },

  async setTime(time) {
    localStorage.setItem(this.TIME_KEY, time);
    if (this.isEnabled()) await this._schedule();
  },

  // Calculate ms until next occurrence of HH:MM and post to SW
  async _schedule() {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg?.active) return;

    const [h, m] = this.getTime().split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const msg = this.MESSAGES[Math.floor(Math.random() * this.MESSAGES.length)];
    reg.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      delay: next - now,
      title: msg.title,
      body: msg.body,
    });
  },

  async init() {
    if (!this.isSupported()) return;
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (e) {
      console.warn('SW registration failed:', e);
      return;
    }
    if (this.isEnabled()) await this._schedule();
  },
};
