// views/overview.js — Tela de Visão Geral (standardized layout)

Views.overview = function(app, ctx) {
  const s = App.state;
  const pLevel = XP.playerLevel(s.skills);
  const pProgress = XP.playerProgress(s.skills);
  const totalXP = XP.playerTotalXP(s.skills);

  const finBalance = s.finances.entries.reduce((a, e) =>
    a + (e.type === 'receita' ? e.value : -e.value), 0);

  // ---- MAIN ----
  let skillsHTML = s.skills.map(sk => {
    const info = XP.calc(sk.xp);
    const pct = Math.round(info.progress * 100);
    return `
      <div class="skill-row" data-skill="${sk.id}">
        <div class="skill-icon" style="background:${sk.color}22; color:${sk.color}">${Icon.skillIcon(sk.id, 20, sk.color)}</div>
        <div class="skill-info">
          <div class="skill-name">${sk.name}
            <span class="skill-level" style="color:${sk.color}">Nível ${info.level}</span>
          </div>
          <div class="xp-bar-container">
            <div class="xp-bar-track">
              <div class="xp-bar-fill" style="width:${pct}%; background:${sk.color}; color:${sk.color}"></div>
            </div>
          </div>
        </div>
        <div style="font-size:10px; color:var(--text-dim); min-width:90px; text-align:right">
          ${info.currentXP} / ${info.nextLevelXP} XP
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <h2 class="view-title">Visão Geral</h2>

    <div class="section-header mt-0">Resumo das Habilidades</div>
    <div class="card card-glow">${skillsHTML}</div>

    <div class="section-header">Saldo Financeiro
      <span class="section-action" id="go-finances">Ver detalhes →</span>
    </div>
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between">
        <div style="font-family:var(--font-title); font-size:22px; font-weight:700; color:${finBalance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
          ${App.formatCurrency(finBalance)}
        </div>
        <div style="color:var(--text-dim)">${Icon.coins(20, 'var(--text-muted)')}</div>
      </div>
    </div>

    <div class="section-header">Ações Rápidas</div>
    <div class="action-grid">
      <div class="action-card" id="act-habit">
        <span class="action-icon">${Icon.sword(28, 'var(--accent-blue)')}</span>
        <span class="action-label">Registrar Hábito</span>
      </div>
      <div class="action-card" id="act-mission">
        <span class="action-icon">${Icon.target(28, 'var(--accent-cyan)')}</span>
        <span class="action-label">Missões</span>
      </div>
      <div class="action-card" id="act-log">
        <span class="action-icon">${Icon.scroll(28, 'var(--accent-green)')}</span>
        <span class="action-label">Criar Log</span>
      </div>
    </div>`;

  document.getElementById('act-habit').onclick = () => App.navigate('skills');
  document.getElementById('act-mission').onclick = () => App.navigate('missions');
  document.getElementById('act-log').onclick = () => App.navigate('logs');
  document.getElementById('go-finances').onclick = () => App.navigate('finances');

  app.querySelectorAll('.skill-row').forEach(row => {
    row.addEventListener('click', () => App.navigate('skills'));
  });

  // ---- CONTEXT ----
  const lastLog = s.logs[0];
  const quotes = [
    "Pequenas ações repetidas todos os dias levam a grandes transformações.",
    "A jornada de mil milhas começa com um único passo.",
    "Disciplina é escolher entre o que você quer agora e o que mais quer.",
    "O que fazemos hoje define quem seremos amanhã.",
    "Cada dia é uma chance de se tornar melhor."
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  ctx.innerHTML = `
    <div class="context-section">
      <div class="context-title">Status</div>
      <div class="card" style="text-align:center; padding:20px">
        <div class="level-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-hover)" stroke-width="6"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent-blue)"
              stroke-width="6" stroke-linecap="round"
              stroke-dasharray="${339.292}" stroke-dashoffset="${339.292 * (1 - pProgress)}"
              style="filter: drop-shadow(0 0 6px var(--accent-blue))"/>
          </svg>
          <div class="level-number">${pLevel}</div>
          <div class="level-label">Nível</div>
        </div>
        <div style="font-size:11px; color:var(--text-muted)">${totalXP} XP Total</div>
      </div>
    </div>
    <div class="context-section">
      <div class="context-title">Sincronização</div>
      <div class="card">
        <div class="stat-row">
          <span class="stat-row-label">${Auth.currentUser ? Icon.checkCircle(16, 'var(--accent-green)') : Icon.target(16, 'var(--text-dim)')} Status</span>
          <span class="stat-row-value" style="color:${Auth.currentUser ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${Auth.currentUser ? 'Nuvem Ativa' : 'Apenas Local'}
          </span>
        </div>
        ${!Auth.currentUser ? `
          <div style="margin-top:10px">
            <button class="btn btn-sm btn-primary" id="connect-supabase" style="width:100%">Conectar Supabase</button>
          </div>
        ` : `
          <div style="font-size:10px; color:var(--text-dim); margin-top:6px; text-align:center">
            Logado como ${Auth.currentUser.email}
          </div>
        `}
      </div>
    </div>
    <div class="context-section">
      <div class="context-title">Streak</div>
      <div class="card">
        <div class="streak-display">
          <span class="streak-fire">${Icon.fire(28, 'var(--accent-gold)')}</span>
          <div>
            <div class="streak-number">${s.player.streak}</div>
            <div class="streak-label">Dias</div>
          </div>
        </div>
      </div>
    </div>
    <div class="context-section">
      <div class="context-title">Último Log</div>
      ${lastLog ? `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
            <span style="display:flex; align-items:center; gap:6px">${Icon.skillIcon(lastLog.skillId, 16, lastLog.skillColor)} ${lastLog.skillName}</span>
            <span style="color:var(--accent-green); font-weight:700; font-size:12px">+${lastLog.xp} XP</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.5">${lastLog.description}</div>
          <div style="font-size:10px; color:var(--text-dim); margin-top:6px">
            ${App.formatDate(lastLog.timestamp)} ${App.formatDateTime(lastLog.timestamp)}
            ${lastLog.aiGenerated ? '<span class="ai-badge">AI</span>' : ''}
          </div>
        </div>` : `
        <div class="card"><div class="empty-state"><div class="empty-icon">${Icon.scroll(32, 'var(--text-dim)')}</div><div class="empty-text">Nenhum log ainda</div></div></div>`}
    </div>
    <div class="context-section">
      <div class="context-title">Dados</div>
      <div class="card">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px">
          <button class="btn btn-sm" id="exp-logs">📋 Logs</button>
          <button class="btn btn-sm" id="exp-fin">💰 Finanças</button>
          <button class="btn btn-sm" id="exp-skills">⚔️ Habilidades</button>
          <button class="btn btn-sm btn-primary" id="exp-full">💾 Backup JSON</button>
        </div>
        <button class="btn btn-sm" id="imp-full" style="width:100%; margin-top:6px; color:var(--accent-cyan); border-color:var(--accent-cyan)">📂 Importar Backup JSON</button>
      </div>
    </div>
    <div class="context-section">
      <div class="context-title">Notificações</div>
      <div class="card">
        <div class="stat-row">
          <span class="stat-row-label">Lembrete diário</span>
          <span class="stat-row-value" id="notif-status" style="color:${Notifications.isEnabled() ? 'var(--accent-green)' : 'var(--text-dim)'}">
            ${Notifications.isEnabled() ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        ${Notifications.isSupported() ? `
          <div style="display:flex; gap:6px; margin-top:10px; align-items:center">
            <input type="time" class="form-input" id="notif-time"
              value="${Notifications.getTime()}"
              style="flex:1; font-size:12px; padding:7px 10px" />
            ${Notifications.isEnabled()
              ? `<button class="btn btn-sm btn-red" id="notif-disable">Desativar</button>`
              : `<button class="btn btn-sm btn-primary" id="notif-enable">Ativar</button>`
            }
          </div>
          <div id="notif-msg" style="font-size:10px; color:var(--text-dim); margin-top:6px"></div>
        ` : `<div style="font-size:11px; color:var(--text-dim); margin-top:6px">Não suportado neste navegador.</div>`}
      </div>
    </div>
    <div class="context-section">
      <div class="context-title">Configuração IA</div>
      <div class="card">
        <div class="stat-row">
          <span class="stat-row-label">DeepSeek API</span>
          <span class="stat-row-value" style="color:${AI.isConfigured() ? 'var(--accent-green)' : 'var(--text-dim)'}">
            ${AI.isConfigured() ? 'Ativa' : 'Inativa'}
          </span>
        </div>
        <div style="margin-top:8px">
          <input type="password" class="form-input" id="ai-key-input"
            placeholder="Cole sua API key do DeepSeek" value="${AI.getApiKey()}"
            style="font-size:11px; padding:8px 10px" />
          <div style="display:flex; gap:6px; margin-top:6px">
            <button class="btn btn-sm btn-primary" id="save-ai-key" style="flex:1">Salvar</button>
            ${AI.isConfigured() ? '<button class="btn btn-sm btn-red" id="clear-ai-key">Limpar</button>' : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="context-section">
      <div class="quote-box">"${quote}"</div>
    </div>`;

  // Export / Import handlers
  document.getElementById('exp-logs').onclick   = () => Export.logs();
  document.getElementById('exp-fin').onclick    = () => Export.finances();
  document.getElementById('exp-skills').onclick = () => Export.skills();
  document.getElementById('exp-full').onclick   = () => Export.full();
  document.getElementById('imp-full').onclick   = () => Export.importJSON();

  // AI key handlers
  const saveBtn = document.getElementById('save-ai-key');
  if (saveBtn) saveBtn.onclick = () => {
    AI.setApiKey(document.getElementById('ai-key-input').value);
    App.navigate('overview'); // refresh
  };
  const clearBtn = document.getElementById('clear-ai-key');
  if (clearBtn) clearBtn.onclick = () => {
    AI.setApiKey('');
    App.navigate('overview');
  };

  // Connect Supabase handler
  const connectBtn = document.getElementById('connect-supabase');
  if (connectBtn) connectBtn.onclick = () => Auth.showLogin();

  // Notification handlers
  const enableBtn = document.getElementById('notif-enable');
  if (enableBtn) enableBtn.onclick = async () => {
    const time = document.getElementById('notif-time')?.value;
    const result = await Notifications.enable(time);
    const msg = document.getElementById('notif-msg');
    if (result.ok) {
      App.navigate('overview');
    } else if (msg) {
      msg.textContent = result.reason;
      msg.style.color = 'var(--accent-red)';
    }
  };

  const disableBtn = document.getElementById('notif-disable');
  if (disableBtn) disableBtn.onclick = () => {
    Notifications.disable();
    App.navigate('overview');
  };

  const timeInput = document.getElementById('notif-time');
  if (timeInput) timeInput.onchange = () => Notifications.setTime(timeInput.value);
};
