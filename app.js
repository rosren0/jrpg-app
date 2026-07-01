// app.js — Router, State, Auth Flow

const App = {
  currentView: 'overview',

  defaultState() {
    return {
      player: { name: 'VIAJANTE', streak: 0, lastActiveDate: null },
      skills: [
        { id: 'disciplina', name: 'Disciplina', xp: 0, level: 1, color: '#4cc2ff' },
        { id: 'estudo',     name: 'Estudo',     xp: 0, level: 1, color: '#4cff8e' },
        { id: 'foco',       name: 'Foco',       xp: 0, level: 1, color: '#c084fc' },
        { id: 'saude',      name: 'Saúde',      xp: 0, level: 1, color: '#fbbf24' }
      ],
      inventory: [],
      finances: { entries: [] },
      logs: [],
      missions: [],
      tasks: []
    };
  },

  state: null,

  // ---- Auth-aware initialization ----
  async boot(user) {
    if (user) {
      Storage.setUser(user.id);
      this.state = await Storage.loadAsync() || this.defaultState();
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'flex';
    } else {
      Storage.setUser(null);
      this.state = Storage.loadLocal() || this.defaultState();
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.style.display = 'none';
    }

    this.ensureFields();
    this.updateStreak();
    this.setupNav();
    this.startClock();
    this.navigate('overview');
    this.updateHeader();
    Notifications.init();
  },

  ensureFields() {
    const def = this.defaultState();
    if (!this.state.finances) this.state.finances = def.finances;
    if (!this.state.logs) this.state.logs = [];
    if (!this.state.inventory) this.state.inventory = [];
    if (!this.state.player) this.state.player = def.player;
    if (!this.state.skills) this.state.skills = def.skills;
    if (!this.state.missions) this.state.missions = [];
    if (!this.state.tasks) this.state.tasks = [];
  },

  save() {
    Storage.save(this.state);
    this.updateHeader();
  },

  // ---- Navigation ----
  _navBound: false,

  setupNav() {
    if (this._navBound) return;
    this._navBound = true;

    // Sidebar nav
    document.querySelectorAll('aside .menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) this.navigate(view);
      });
    });

    // Bottom nav (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) this.navigate(view);
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.signOut();
      });
    }
  },

  navigate(view) {
    this.currentView = view;
    // Update sidebar active
    document.querySelectorAll('aside .menu-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    // Update bottom nav active
    document.querySelectorAll('.bottom-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });
    // Render view
    const app = document.getElementById('app');
    const ctx = document.getElementById('context');
    app.innerHTML = '';
    ctx.innerHTML = '';

    switch (view) {
      case 'overview':  Views.overview(app, ctx); break;
      case 'skills':    Views.skills(app, ctx); break;
      case 'inventory': Views.inventory(app, ctx); break;
      case 'finances':  Views.finances(app, ctx); break;
      case 'logs':      Views.logs(app, ctx); break;
      case 'missions':  Views.missions(app, ctx); break;
      case 'tasks':     Views.tasks(app, ctx); break;
    }

    // On mobile/tablet, append context content inline below main
    this.inlineContext(app, ctx);

    app.classList.remove('view-enter');
    void app.offsetWidth;
    app.classList.add('view-enter');
  },

  // Move context panel content inline for smaller screens
  inlineContext(app, ctx) {
    if (window.innerWidth < 1024 && ctx.innerHTML.trim()) {
      const inline = document.createElement('div');
      inline.className = 'context-inline';
      inline.innerHTML = ctx.innerHTML;
      app.appendChild(inline);
    }
  },

  // ---- Header Updates ----
  updateHeader() {
    const s = this.state;
    const pLevel = XP.playerLevel(s.skills);
    const pProgress = XP.playerProgress(s.skills);
    const totalXP = XP.playerTotalXP(s.skills);

    document.getElementById('player-name').textContent = s.player.name;
    document.getElementById('player-level-header').textContent = `Nível ${pLevel}`;
    document.getElementById('player-avatar').textContent = s.player.name.charAt(0);

    const bar = document.getElementById('header-xp-bar');
    bar.style.width = `${Math.round(pProgress * 100)}%`;
    document.getElementById('header-xp-values').textContent = `${totalXP} XP`;
  },

  // ---- Clock ----
  _clockStarted: false,
  startClock() {
    if (this._clockStarted) return;
    this._clockStarted = true;
    const update = () => {
      const now = new Date();
      const days = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
      const d = String(now.getDate()).padStart(2,'0');
      const m = String(now.getMonth()+1).padStart(2,'0');
      const h = String(now.getHours()).padStart(2,'0');
      const min = String(now.getMinutes()).padStart(2,'0');
      document.getElementById('datetime').innerHTML =
        `${days[now.getDay()]} ${d}/${m}<br>${h}:${min}`;
    };
    update();
    setInterval(update, 10000);
  },

  // ---- Streak ----
  updateStreak() {
    const today = new Date().toDateString();
    const last = this.state.player.lastActiveDate;
    if (!last) return;
    const lastDate = new Date(last);
    const diff = Math.floor((new Date(today) - lastDate) / 86400000);
    if (diff > 1) this.state.player.streak = 0;
  },

  markActive() {
    const today = new Date().toDateString();
    const last = this.state.player.lastActiveDate;
    if (last !== today) {
      const lastDate = last ? new Date(last) : null;
      const diff = lastDate ? Math.floor((new Date(today) - lastDate) / 86400000) : 0;
      if (diff === 1) {
        this.state.player.streak++;
      } else if (diff > 1) {
        this.state.player.streak = 1;
      } else if (!last) {
        this.state.player.streak = 1;
      }
      this.state.player.lastActiveDate = today;
    }
  },

  // ---- Log Creation ----
  addLog(skillId, xpGained, description, auto = true, aiGenerated = false) {
    const skill = this.state.skills.find(s => s.id === skillId);
    this.state.logs.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      skillId,
      skillName: skill ? skill.name : '',
      skillColor: skill ? skill.color : '',
      xp: xpGained,
      description,
      auto,
      aiGenerated
    });
    if (this.state.logs.length > 200) this.state.logs = this.state.logs.slice(0, 200);
  },

  // ---- Modal System ----
  showModal(title, contentHTML, onSubmit) {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
          <div class="modal-title">${title}</div>
          <div id="modal-body">${contentHTML}</div>
          <div class="modal-actions">
            <button class="btn" id="modal-cancel">Cancelar</button>
            <button class="btn btn-primary" id="modal-confirm">Confirmar</button>
          </div>
        </div>
      </div>`;
    document.getElementById('modal-cancel').onclick = () => this.closeModal();
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });
    document.getElementById('modal-confirm').onclick = async () => {
      const btn = document.getElementById('modal-confirm');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ai-loading"></span> Aguardando IA...'; }
      if (onSubmit) await onSubmit();
    };
  },

  closeModal() {
    document.getElementById('modal-root').innerHTML = '';
  },

  // ---- Level Up Effect ----
  showLevelUp(skillName, newLevel) {
    const root = document.getElementById('levelup-root');
    root.innerHTML = `
      <div class="levelup-overlay" id="levelup-overlay">
        <div class="levelup-text">— LEVEL UP! —</div>
        <div class="levelup-sub">${skillName} → Nível ${newLevel}</div>
      </div>`;
    setTimeout(() => { root.innerHTML = ''; }, 2500);
    document.getElementById('levelup-overlay').addEventListener('click', () => { root.innerHTML = ''; });
  },

  // ---- Utility ----
  genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  formatDate(iso) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  formatDateTime(iso) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
};

// Views namespace declared in index.html

// ---- Boot via Auth ----
document.addEventListener('DOMContentLoaded', () => {
  Auth.init(user => App.boot(user));
});
