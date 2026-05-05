// views/missions.js — Missions View

Views.missions = function(app, ctx) {
  const s = App.state;
  const today = new Date().toDateString();

  function render() {
    const todayMissions = s.missions.filter(m => m.date === today);
    const completed = todayMissions.filter(m => m.completed);
    const pending = todayMissions.filter(m => !m.completed);

    const pendingHTML = pending.length > 0 ? pending.map(m => renderMission(m)).join('') : '<div class="empty-state"><div class="empty-text">Nenhuma missão pendente</div></div>';
    const completedHTML = completed.length > 0 ? completed.map(m => renderMission(m)).join('') : '';

    app.innerHTML = `
      <h2 class="view-title">Missões</h2>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div class="section-header mt-0">Objetivos do Dia</div>
        <div style="display:flex; gap:8px">
          <button class="btn btn-sm" id="suggest-ai-btn">${Icon.brain(14, 'var(--accent-cyan)')} Sugerir com IA</button>
          <button class="btn btn-primary btn-sm" id="add-mission-btn">${Icon.plus(14)} Nova Missão</button>
        </div>
      </div>

      <div class="missions-list">
        ${pendingHTML}
        ${completed.length > 0 ? `<div class="section-header">Concluídas</div>${completedHTML}` : ''}
      </div>
    `;

    document.getElementById('add-mission-btn').onclick = () => showAddMissionModal();
    document.getElementById('suggest-ai-btn').onclick = () => suggestMissions();

    app.querySelectorAll('.mission-item').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('.mission-action-btn')) return;
        const id = el.dataset.id;
        const mission = s.missions.find(m => m.id === id);
        if (mission && !mission.completed) completeMission(mission);
      };
    });

    app.querySelectorAll('.mission-action-btn.edit').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const mission = s.missions.find(m => m.id === id);
        if (mission) showEditMissionModal(mission);
      };
    });

    app.querySelectorAll('.mission-action-btn.delete').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        deleteMission(id);
      };
    });

    renderCtx();
  }

  function renderMission(m) {
    const skill = s.skills.find(sk => sk.id === m.skillId);
    return `
      <div class="mission-item ${m.completed ? 'completed' : ''}" data-id="${m.id}">
        <div class="mission-check">${m.completed ? Icon.checkCircle(20) : Icon.circle(20)}</div>
        <div class="mission-content">
          <div class="mission-title">${m.title}</div>
          <div class="mission-meta">
            <span style="display:inline-flex; align-items:center; gap:4px; color:${skill?.color || 'var(--text-muted)'}">${Icon.skillIcon(m.skillId, 12, skill?.color)} ${skill?.name || 'Geral'}</span>
            ${m.aiGenerated ? '<span class="ai-badge">AI SUGGESTION</span>' : ''}
          </div>
        </div>
        <div class="mission-xp">+${m.xpReward} XP</div>
        <div class="mission-actions">
          ${!m.completed ? `<button class="mission-action-btn edit" data-id="${m.id}" title="Editar">${Icon.edit(14)}</button>` : ''}
          <button class="mission-action-btn delete" data-id="${m.id}" title="Deletar">${Icon.trash(14)}</button>
        </div>
      </div>
    `;
  }

  function renderCtx() {
    const todayMissions = s.missions.filter(m => m.date === today);
    const total = todayMissions.length;
    const completedCount = todayMissions.filter(m => m.completed).length;
    const progress = total > 0 ? (completedCount / total) : 0;
    const todayMissionXP = todayMissions.filter(m => m.completed).reduce((a, m) => a + m.xpReward, 0);

    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title">Progresso Diário</div>
        <div class="card" style="text-align:center; padding:20px">
           <div class="level-circle">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-hover)" stroke-width="6"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent-green)"
                stroke-width="6" stroke-linecap="round"
                stroke-dasharray="339.292" stroke-dashoffset="${339.292 * (1 - progress)}"
                style="filter: drop-shadow(0 0 6px var(--accent-green))"/>
            </svg>
            <div class="level-number" style="color:var(--accent-green)">${completedCount}/${total}</div>
            <div class="level-label">Missões</div>
          </div>
          <div style="font-size:11px; color:var(--text-muted)">+${todayMissionXP} XP ganho hoje</div>
        </div>
      </div>

      <div class="context-section">
        <div class="context-title">Dica do Mestre</div>
        <div class="card">
          <div style="font-size:12px; color:var(--text-muted); line-height:1.6; font-style:italic">
            "Completar missões diárias é o caminho mais rápido para a maestria. A IA pode sugerir desafios baseados no seu histórico."
          </div>
        </div>
      </div>
    `;
  }

  function showAddMissionModal() {
    const skillOpts = s.skills.map(sk => `<option value="${sk.id}">${sk.name}</option>`).join('');
    App.showModal('Nova Missão', `
      <div class="form-group">
        <label class="form-label">O que você pretende fazer?</label>
        <input type="text" class="form-input" id="miss-title" placeholder="Ex: Ler 20 páginas de um livro" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">Habilidade Relacionada</label>
        <select class="form-select" id="miss-skill">${skillOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Recompensa (XP)</label>
        <input type="number" class="form-input" id="miss-xp" value="50" step="10" min="10" max="200" />
      </div>
    `, () => {
      const title = document.getElementById('miss-title').value.trim();
      const skillId = document.getElementById('miss-skill').value;
      const xp = parseInt(document.getElementById('miss-xp').value) || 50;
      if (!title) return;

      s.missions.push({
        id: App.genId(),
        title,
        skillId,
        xpReward: xp,
        completed: false,
        createdAt: new Date().toISOString(),
        date: today,
        aiGenerated: false
      });

      App.save();
      App.closeModal();
      render();
    });
  }

  async function suggestMissions() {
    if (!AI.isConfigured()) {
      alert("Configure a chave da API do DeepSeek na Visão Geral para usar sugestões de IA.");
      return;
    }

    const suggestions = await AI.suggestMissions(s.skills, s.logs);
    if (!suggestions) {
      alert("Falha ao obter sugestões da IA.");
      return;
    }

    // Modal to preview suggestions
    const suggestionsHTML = suggestions.map((m, i) => `
      <div class="card" style="margin-bottom:8px; border-left:3px solid var(--accent-cyan)">
        <div style="font-weight:600; font-size:13px">${m.title}</div>
        <div style="font-size:10px; color:var(--text-dim); display:flex; justify-content:space-between; margin-top:4px">
          <span>${s.skills.find(sk => sk.id === m.skillId)?.name || m.skillId}</span>
          <span style="color:var(--accent-green)">+${m.xpReward} XP</span>
        </div>
      </div>
    `).join('');

    App.showModal('Sugestões da IA', `
      <div style="margin-bottom:12px; font-size:12px; color:var(--text-muted)">O mestre sugere estas missões para o seu dia:</div>
      ${suggestionsHTML}
    `, () => {
      suggestions.forEach(m => {
        s.missions.push({
          id: App.genId(),
          title: m.title,
          skillId: m.skillId,
          xpReward: m.xpReward,
          completed: false,
          createdAt: new Date().toISOString(),
          date: today,
          aiGenerated: true
        });
      });
      App.save();
      App.closeModal();
      render();
    });
  }

  function showEditMissionModal(m) {
    const skillOpts = s.skills.map(sk => `<option value="${sk.id}" ${sk.id === m.skillId ? 'selected' : ''}>${sk.name}</option>`).join('');
    App.showModal('Editar Missão', `
      <div class="form-group">
        <label class="form-label">O que você pretende fazer?</label>
        <input type="text" class="form-input" id="edit-miss-title" value="${m.title.replace(/"/g, '&quot;')}" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">Habilidade Relacionada</label>
        <select class="form-select" id="edit-miss-skill">${skillOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Recompensa (XP)</label>
        <input type="number" class="form-input" id="edit-miss-xp" value="${m.xpReward}" step="10" min="10" max="200" />
      </div>
    `, () => {
      const title = document.getElementById('edit-miss-title').value.trim();
      const skillId = document.getElementById('edit-miss-skill').value;
      const xp = parseInt(document.getElementById('edit-miss-xp').value) || m.xpReward;
      if (!title) return;

      m.title = title;
      m.skillId = skillId;
      m.xpReward = xp;

      App.save();
      App.closeModal();
      render();
    });
  }

  function deleteMission(id) {
    const idx = s.missions.findIndex(m => m.id === id);
    if (idx === -1) return;
    s.missions.splice(idx, 1);
    App.save();
    render();
  }

  function completeMission(m) {
    m.completed = true;
    m.completedAt = new Date().toISOString();
    
    const skill = s.skills.find(sk => sk.id === m.skillId);
    if (skill) {
      const res = XP.add(skill, m.xpReward);
      App.addLog(m.skillId, m.xpReward, `[MISSÃO] ${m.title}`, true, false);
      if (res.leveledUp) App.showLevelUp(skill.name, res.newLevel);
    }
    
    App.save();
    render();
  }

  render();
};
