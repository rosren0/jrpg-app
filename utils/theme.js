// utils/theme.js — Dark / Light theme manager

const Theme = {
  STORAGE_KEY: 'jrpg-theme',

  // Apply theme to <html> and persist
  apply(mode) {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(this.STORAGE_KEY, mode);
  },

  toggle() {
    const current = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.apply(current === 'dark' ? 'light' : 'dark');
  },

  // Call once on page load to restore saved preference
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.apply(saved);
  }
};
