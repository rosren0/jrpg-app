// views/skills.js — Tela de Habilidades (AI-enhanced + standardized)

Views.skills = function(app, ctx) {
  const s = App.state;
  let selectedSkillId = s.skills[0]?.id;

  function render() {
    const skillCards = s.skills.map(sk => {
      const info = XP.calc(sk.xp);
      const pct = Math.round(info.progress * 100);
      const recentLogs = s.logs.filter(l => l.skillId === sk.id).slice(0, 3);
      const isSelected = sk.id === selectedSkillId;

      return `
        <div class="card ${isSelected ? 'card-glow' : ''}" data-skill-card="${sk.id}" style="cursor:pointer; ${isSelected ? 'border-color:' + sk.color + '44' : ''}">
          <div class="card-header">
            <div class="skill-icon" style="background:${sk.color}22; color:${sk.color}; width:44px; height:44px">${Icon.skillIcon(sk.id, 24, sk.color)}</div>
            <div style="flex:1">
              <div class="card-header-title">${sk.name}</div>
              <div class="card-header-sub" style="color:${sk.color}">Nível ${info.level}</div>
            </div>
            <button class="btn btn-primary btn-sm" data-register="${sk.id}">${Icon.plus(14)} Registrar</button>
          </div>
          <div class="xp-bar-container">
            <div class="xp-bar-header">
              <span class="xp-bar-label">Progresso</span>
              <span class="xp-bar-values">${info.currentXP} / ${info.nextLevelXP} XP</span>
            </div>
            <div class="xp-bar-track" style="height:10px">
              <div class="xp-bar-fill" style="width:${pct}%; background:${sk.color}; color:${sk.color}"></div>
            </div>
          </div>
          ${recentLogs.length > 0 ? `
            <div style="margin-top:10px; padding-top:8px; border-top:1px solid var(--border)">
              ${recentLogs.map(l => `
                <div class="stat-row">
                  <span class="stat-row-label">${l.description.substring(0, 40)}${l.description.length > 40 ? '…' : ''}
                    ${l.aiGenerated ? '<span class="ai-badge">AI</span>' : ''}
                  </span>
                  <span class="stat-row-value" style="color:var(--accent-green)">+${l.xp}</span>
                </div>`).join('')}
            </div>` : ''}
        </div>`;
    }).join('');

    app.innerHTML = `
      <h2 class="view-title">Habilidades</h2>
      ${skillCards}`;

    app.querySelectorAll('[data-register]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); showRegisterModal(btn.dataset.register); });
    });
    app.querySelectorAll('[data-skill-card]').forEach(card => {
      card.addEventListener('click', () => { selectedSkillId = card.dataset.skillCard; render(); renderContext(); });
    });
    renderContext();
  }

  function renderContext() {
    const sk = s.skills.find(sk => sk.id === selectedSkillId);
    if (!sk) { ctx.innerHTML = ''; return; }
    const info = XP.calc(sk.xp);
    const skillLogs = s.logs.filter(l => l.skillId === sk.id);
    const last7 = getLast7DaysXP(sk.id);

    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title" style="display:flex; align-items:center; gap:8px">${Icon.skillIcon(sk.id, 16, sk.color)} ${sk.name}</div>
        <div class="card" style="text-align:center; padding:20px">
          <div class="level-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-hover)" stroke-width="6"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="${sk.color}"
                stroke-width="6" stroke-linecap="round"
                stroke-dasharray="339.292" stroke-dashoffset="${339.292 * (1 - info.progress)}"
                style="filter: drop-shadow(0 0 6px ${sk.color})"/>
            </svg>
            <div class="level-number" style="color:${sk.color}">${info.level}</div>
            <div class="level-label">Nível</div>
          </div>
          <div style="font-size:11px; color:var(--text-muted)">${info.currentXP} / ${info.nextLevelXP} XP</div>
        </div>
      </div>
      <div class="context-section">
        <div class="context-title">XP Últimos 7 Dias</div>
        <div class="card">
          <div style="display:flex; align-items:flex-end; gap:4px; height:60px">
            ${last7.map(d => {
              const maxH = Math.max(...last7.map(x => x.xp), 1);
              const h = Math.max(4, (d.xp / maxH) * 50);
              return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px">
                <div style="font-size:8px; color:var(--text-dim)">${d.xp}</div>
                <div style="width:100%; height:${h}px; background:${sk.color}44; border-radius:3px; border:1px solid ${sk.color}66"></div>
                <div style="font-size:7px; color:var(--text-dim)">${d.label}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="context-section">
        <div class="context-title">Histórico</div>
        ${skillLogs.length > 0 ? skillLogs.slice(0, 8).map(l => `
          <div class="log-entry">
            <div class="log-time">${App.formatDateTime(l.timestamp)}</div>
            <div class="log-content">
              <div class="log-desc">${l.description}
                ${l.aiGenerated ? ' <span class="ai-badge">AI</span>' : ''}
              </div>
              <div class="log-xp" style="color:var(--accent-green)">+${l.xp} XP</div>
            </div>
          </div>`).join('') : '<div class="empty-state"><div class="empty-text">Nenhum registro ainda</div></div>'}
      </div>`;
  }

  function getLast7DaysXP(skillId) {
    const days = [];
    const dayNames = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const xp = s.logs.filter(l => l.skillId === skillId && new Date(l.timestamp).toDateString() === ds)
                       .reduce((a, l) => a + l.xp, 0);
      days.push({ label: dayNames[d.getDay()], xp });
    }
    return days;
  }

  function showRegisterModal(skillId) {
    const sk = s.skills.find(s => s.id === skillId);
    const hasAI = AI.isConfigured();

    App.showModal(`Registrar — ${sk.name}`, `
      <div class="form-group">
        <label class="form-label">O que você fez?</label>
        <input type="text" class="form-input" id="habit-desc" placeholder="Ex: Meditei 10 minutos" autofocus />
      </div>
      <div style="font-size:10px; color:var(--accent-cyan); display:flex; align-items:center; gap:4px; margin-top:-6px"><span class="ai-badge">AI</span> O Mestre (DeepSeek) avaliará seu esforço e atribuirá o XP.</div>
    `, async () => {
      const desc = document.getElementById('habit-desc').value.trim();
      if (!desc) return;

      let xpVal = 50;
      let finalDesc = desc;
      let aiGenerated = false;

      if (hasAI) {
        const eval = await AI.evaluateActivity(desc, sk.name);
        if (eval) {
          xpVal = eval.xp;
          finalDesc = eval.description;
          aiGenerated = true;
        }
      }

      const result = XP.add(sk, xpVal);
      App.markActive();
      App.addLog(sk.id, xpVal, finalDesc, false, aiGenerated);
      App.save();
      App.closeModal();
      if (result.leveledUp) App.showLevelUp(sk.name, result.newLevel);
      render();
    });
  }

  render();
};
