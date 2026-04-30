// views/logs.js — Tela de Logs (standardized + AI badges)

Views.logs = function(app, ctx) {
  const s = App.state;
  let filterSkill = 'all';

  function render() {
    const filtered = filterSkill === 'all' ? s.logs : s.logs.filter(l => l.skillId === filterSkill);
    const grouped = {};
    filtered.forEach(l => { const day = new Date(l.timestamp).toDateString(); if (!grouped[day]) grouped[day] = []; grouped[day].push(l); });

    const tabs = [{ id:'all', label:'Todos', icon:Icon.list(14) }, ...s.skills.map(sk => ({ id:sk.id, label:sk.name, icon:Icon.skillIcon(sk.id,14,sk.color) }))];
    const tabsHTML = tabs.map(t => `<div class="tab ${filterSkill===t.id?'active':''}" data-filter="${t.id}" style="display:flex; align-items:center; gap:4px">${t.icon} ${t.label}</div>`).join('');

    let logsHTML = '';
    const days = Object.entries(grouped);
    if (days.length > 0) {
      days.forEach(([day, logs]) => {
        const d = new Date(day);
        const label = isToday(d) ? 'HOJE' : isYesterday(d) ? 'ONTEM' : App.formatDate(d.toISOString());
        logsHTML += `<div class="log-day-header">${label}</div>`;
        logs.forEach(l => {
          logsHTML += `<div class="log-entry">
            <div class="log-time">${App.formatDateTime(l.timestamp)}</div>
            <div class="log-content">
              <div><span class="log-skill-badge" style="background:${l.skillColor}18; color:${l.skillColor}; display:inline-flex; align-items:center; gap:4px">${Icon.skillIcon(l.skillId,12,l.skillColor)} ${l.skillName}</span>
              <span class="log-tag ${l.auto?'auto':'manual'}">${l.auto?'AUTO':'MANUAL'}</span>
              ${l.aiGenerated ? '<span class="ai-badge">AI</span>' : ''}</div>
              <div class="log-desc">${l.description}</div>
              <div class="log-xp" style="color:var(--accent-green)">+${l.xp} XP</div>
            </div></div>`;
        });
      });
    } else {
      logsHTML = `<div class="empty-state" style="padding:40px"><div class="empty-icon">${Icon.scroll(32,'var(--text-dim)')}</div><div class="empty-text">Nenhum log registrado</div></div>`;
    }

    app.innerHTML = `
      <h2 class="view-title">Logs</h2>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div class="tabs">${tabsHTML}</div>
        <button class="btn btn-primary btn-sm" id="add-log-btn">${Icon.plus(14)} Novo Log</button>
      </div>
      <div class="card">${logsHTML}</div>`;

    app.querySelectorAll('[data-filter]').forEach(t => t.addEventListener('click', () => { filterSkill = t.dataset.filter; render(); }));
    document.getElementById('add-log-btn').onclick = () => showLogModal();
    renderCtx();
  }

  function renderCtx() {
    const today = new Date().toDateString();
    const todayLogs = s.logs.filter(l => new Date(l.timestamp).toDateString() === today);
    const todayXP = todayLogs.reduce((a,l) => a + l.xp, 0);
    const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay());
    const weekLogs = s.logs.filter(l => new Date(l.timestamp) >= ws);
    const weekXP = weekLogs.reduce((a,l) => a + l.xp, 0);
    const skillStats = s.skills.map(sk => ({ ...sk, todayXP: todayLogs.filter(l => l.skillId === sk.id).reduce((a,l) => a + l.xp, 0) }));

    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title">Estatísticas</div>
        <div class="card">
          <div class="stat-row"><span class="stat-row-label">Logs Hoje</span><span class="stat-row-value" style="color:var(--accent-blue)">${todayLogs.length}</span></div>
          <div class="stat-row"><span class="stat-row-label">XP Hoje</span><span class="stat-row-value" style="color:var(--accent-green)">+${todayXP}</span></div>
          <div class="stat-row stat-row-divider"><span class="stat-row-label">Logs Semana</span><span class="stat-row-value">${weekLogs.length}</span></div>
          <div class="stat-row"><span class="stat-row-label">XP Semana</span><span class="stat-row-value" style="color:var(--accent-green)">+${weekXP}</span></div>
        </div>
      </div>
      <div class="context-section">
        <div class="context-title">XP Hoje por Skill</div>
        <div class="card">
          ${skillStats.map(sk => `<div class="stat-row"><span class="stat-row-label">${Icon.skillIcon(sk.id,16,sk.color)} ${sk.name}</span><span class="stat-row-value" style="color:${sk.color}">+${sk.todayXP} XP</span></div>`).join('')}
        </div>
      </div>
      <div class="context-section">
        <div class="context-title">Total</div>
        <div class="card" style="text-align:center; padding:16px">
          <div style="font-family:var(--font-title); font-size:28px; font-weight:700; color:var(--accent-blue)">${s.logs.length}</div>
          <div style="font-size:10px; color:var(--text-dim); margin-top:4px">registros</div>
        </div>
      </div>`;
  }

  function showLogModal() {
    const opts = s.skills.map(sk => `<option value="${sk.id}">${sk.name}</option>`).join('');
    const hasAI = AI.isConfigured();
    
    App.showModal('Novo Log', `
      <div class="form-group"><label class="form-label">Habilidade</label><select class="form-select" id="log-skill">${opts}</select></div>
      <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-input" id="log-desc" placeholder="O que você fez?" autofocus /></div>
      ${hasAI ? '<div style="font-size:10px; color:var(--accent-cyan); display:flex; align-items:center; gap:4px"><span class="ai-badge">AI</span> O Mestre (DeepSeek) avaliará seu esforço e atribuirá o XP.</div>' : ''}
    `, async () => {
      const skillId = document.getElementById('log-skill').value;
      const desc = document.getElementById('log-desc').value.trim();
      if (!desc) return;
      
      const sk = s.skills.find(sk => sk.id === skillId);
      let xpVal = 50, finalDesc = desc, aiGen = false;
      
      if (hasAI) {
        const eval = await AI.evaluateActivity(desc, sk.name);
        if (eval) { xpVal = eval.xp; finalDesc = eval.description; aiGen = true; }
      }

      const result = XP.add(sk, xpVal);
      App.markActive();
      App.addLog(skillId, xpVal, finalDesc, false, aiGen);
      App.save(); App.closeModal();
      if (result.leveledUp) App.showLevelUp(sk.name, result.newLevel);
      render();
    });
  }

  function isToday(d) { return d.toDateString() === new Date().toDateString(); }
  function isYesterday(d) { const y = new Date(); y.setDate(y.getDate()-1); return d.toDateString() === y.toDateString(); }
  render();
};
