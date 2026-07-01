// views/tasks.js — Kanban Board View

Views.tasks = function(app, ctx) {
  const s = App.state;

  const COLUMNS = [
    { id: 'backlog',  label: 'Backlog',        color: 'var(--text-muted)' },
    { id: 'doing',    label: 'Em Andamento',   color: 'var(--accent-cyan)' },
    { id: 'done',     label: 'Conclu\u00eddo',      color: 'var(--accent-green)' }
  ];

  const PRIORITIES = [
    { id: 'high', label: 'Alta',  color: 'var(--accent-red)' },
    { id: 'med',  label: 'M\u00e9dia', color: 'var(--accent-gold)' },
    { id: 'low',  label: 'Baixa', color: 'var(--text-dim)' }
  ];

  // Auto-clear done tasks older than 7 days on load
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const before = s.tasks.length;
  s.tasks = s.tasks.filter(t => !(t.status === 'done' && t.doneAt && new Date(t.doneAt).getTime() < sevenDaysAgo));
  if (s.tasks.length !== before) App.save();

  // ---- Render ----
  function render() {
    app.innerHTML = `
      <div class="kanban-header">
        <h2 class="view-title" style="margin-bottom:0">Kanban</h2>
        <button class="btn btn-primary btn-sm" id="add-task-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova Tarefa
        </button>
      </div>

      <div class="kanban-board">
        ${COLUMNS.map(col => renderColumn(col)).join('')}
      </div>
    `;

    document.getElementById('add-task-btn').onclick = () => showAddModal();

    // Column quick-add buttons
    app.querySelectorAll('.kanban-quick-add').forEach(btn => {
      btn.onclick = () => showAddModal(btn.dataset.status);
    });

    // Card forward (→) buttons
    app.querySelectorAll('.kanban-btn-fwd').forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); moveTask(btn.dataset.id, 1); };
    });

    // Card back (←) buttons
    app.querySelectorAll('.kanban-btn-back').forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); moveTask(btn.dataset.id, -1); };
    });

    // Delete buttons
    app.querySelectorAll('.kanban-btn-del').forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); deleteTask(btn.dataset.id); };
    });

    // Edit (click card body)
    app.querySelectorAll('.kanban-card-body').forEach(el => {
      el.onclick = () => {
        const task = s.tasks.find(t => t.id === el.dataset.id);
        if (task) showEditModal(task);
      };
    });

    renderCtx();
  }

  function renderColumn(col) {
    const cards = s.tasks.filter(t => t.status === col.id);
    const colIdx = COLUMNS.findIndex(c => c.id === col.id);

    return `
      <div class="kanban-col" id="col-${col.id}">
        <div class="kanban-col-header">
          <span class="kanban-col-title" style="color:${col.color}">${col.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>

        <div class="kanban-cards">
          ${cards.length === 0
            ? `<div class="kanban-empty">Nenhuma tarefa</div>`
            : cards.map(t => renderCard(t, colIdx)).join('')
          }
        </div>

        ${col.id !== 'done' ? `
          <button class="kanban-quick-add" data-status="${col.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar
          </button>` : ''}
      </div>
    `;
  }

  function renderCard(t, colIdx) {
    const skill = t.skillId ? s.skills.find(sk => sk.id === t.skillId) : null;
    const prio = PRIORITIES.find(p => p.id === t.priority) || PRIORITIES[1];
    const canBack = colIdx > 0;
    const canFwd  = colIdx < COLUMNS.length - 1;

    return `
      <div class="kanban-card ${t.status === 'done' ? 'is-done' : ''}">
        <div class="kanban-card-body" data-id="${t.id}" title="Clique para editar">
          <div class="kanban-card-top">
            <span class="priority-dot" style="background:${prio.color}" title="Prioridade ${prio.label}"></span>
            <span class="kanban-card-title">${escHtml(t.title)}</span>
          </div>
          ${t.description ? `<div class="kanban-card-desc">${escHtml(t.description)}</div>` : ''}
          ${skill ? `
            <div class="kanban-card-skill" style="color:${skill.color}">
              ${skillDot(skill.color)} ${skill.name}
            </div>` : ''}
        </div>
        <div class="kanban-card-actions">
          ${canBack ? `<button class="kanban-btn kanban-btn-back" data-id="${t.id}" title="Mover para coluna anterior">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>` : '<span class="kanban-btn-placeholder"></span>'}
          <button class="kanban-btn kanban-btn-del" data-id="${t.id}" title="Excluir tarefa">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
          ${canFwd ? `<button class="kanban-btn kanban-btn-fwd" data-id="${t.id}" title="Avan\u00e7ar para pr\u00f3xima coluna">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>` : '<span class="kanban-btn-placeholder"></span>'}
        </div>
      </div>
    `;
  }

  function renderCtx() {
    const total   = s.tasks.length;
    const backlog = s.tasks.filter(t => t.status === 'backlog').length;
    const doing   = s.tasks.filter(t => t.status === 'doing').length;
    const done    = s.tasks.filter(t => t.status === 'done').length;

    // Tasks in "doing" for more than 3 days
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const stale = s.tasks.filter(t =>
      t.status === 'doing' && new Date(t.createdAt).getTime() < threeDaysAgo
    ).length;

    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title">Visão Geral</div>
        <div class="card">
          <div class="kanban-stat-row">
            <span class="kanban-stat-label" style="color:var(--text-muted)">Backlog</span>
            <span class="kanban-stat-val">${backlog}</span>
          </div>
          <div class="kanban-stat-row">
            <span class="kanban-stat-label" style="color:var(--accent-cyan)">Em Andamento</span>
            <span class="kanban-stat-val">${doing}</span>
          </div>
          <div class="kanban-stat-row">
            <span class="kanban-stat-label" style="color:var(--accent-green)">Conclu\u00eddo</span>
            <span class="kanban-stat-val">${done}</span>
          </div>
          <div class="kanban-stat-divider"></div>
          <div class="kanban-stat-row">
            <span class="kanban-stat-label">Total</span>
            <span class="kanban-stat-val">${total}</span>
          </div>
        </div>
      </div>

      ${stale > 0 ? `
      <div class="context-section">
        <div class="context-title">Aten\u00e7\u00e3o</div>
        <div class="card" style="border-color:rgba(255,107,107,0.3)">
          <div style="font-size:12px; color:var(--accent-red); font-weight:600; margin-bottom:4px">
            ${stale} tarefa${stale > 1 ? 's' : ''} parada${stale > 1 ? 's' : ''}
          </div>
          <div style="font-size:11px; color:var(--text-muted); line-height:1.5">
            ${stale > 1 ? 'Tarefas' : 'Uma tarefa'} em andamento h\u00e1 mais de 3 dias. Considere concluir ou mover de volta ao Backlog.
          </div>
        </div>
      </div>` : ''}

      <div class="context-section">
        <div class="context-title">Prioridades</div>
        <div class="card">
          ${PRIORITIES.map(p => {
            const count = s.tasks.filter(t => t.priority === p.id && t.status !== 'done').length;
            return `
              <div class="kanban-stat-row">
                <span class="kanban-stat-label" style="display:flex;align-items:center;gap:6px">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.color};display:inline-block;flex-shrink:0"></span>
                  ${p.label}
                </span>
                <span class="kanban-stat-val">${count}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="context-section">
        <div class="context-title">Dica</div>
        <div class="card">
          <div style="font-size:11px; color:var(--text-muted); line-height:1.6; font-style:italic">
            Use <strong style="color:var(--text-primary)">→</strong> para avan\u00e7ar tarefas entre colunas. Tarefas conclu\u00eddas s\u00e3o removidas automaticamente ap\u00f3s 7 dias.
          </div>
        </div>
      </div>
    `;
  }

  // ---- Modals ----
  function showAddModal(defaultStatus = 'backlog') {
    const skillOpts = `<option value="">— Nenhuma —</option>` +
      s.skills.map(sk => `<option value="${sk.id}">${sk.name}</option>`).join('');

    const statusOpts = COLUMNS.map(c =>
      `<option value="${c.id}" ${c.id === defaultStatus ? 'selected' : ''}>${c.label}</option>`
    ).join('');

    App.showModal('Nova Tarefa', `
      <div class="form-group">
        <label class="form-label">Título <span style="color:var(--accent-red)">*</span></label>
        <input type="text" class="form-input" id="task-title" placeholder="O que precisa ser feito?" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">Descrição <span style="color:var(--text-dim)">opcional</span></label>
        <textarea class="form-input" id="task-desc" rows="2" placeholder="Detalhes adicionais..." style="resize:vertical; min-height:60px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Prioridade</label>
        <div class="priority-pills" id="task-priority-pills">
          ${PRIORITIES.map((p, i) => `
            <button type="button" class="priority-pill ${i === 1 ? 'active' : ''}" data-prio="${p.id}" style="--pill-color:${p.color}">
              <span class="priority-dot" style="background:${p.color}"></span>${p.label}
            </button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Coluna</label>
        <select class="form-select" id="task-status">${statusOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Habilidade <span style="color:var(--text-dim)">opcional</span></label>
        <select class="form-select" id="task-skill">${skillOpts}</select>
      </div>
    `, () => {
      const title = document.getElementById('task-title').value.trim();
      if (!title) return;
      const activePill = document.querySelector('#task-priority-pills .priority-pill.active');
      s.tasks.push({
        id: App.genId(),
        title,
        description: document.getElementById('task-desc').value.trim(),
        status: document.getElementById('task-status').value,
        priority: activePill ? activePill.dataset.prio : 'med',
        skillId: document.getElementById('task-skill').value || null,
        createdAt: new Date().toISOString(),
        doneAt: null
      });
      App.save();
      App.closeModal();
      render();
    });

    // Wire up priority pills
    setTimeout(() => {
      document.querySelectorAll('#task-priority-pills .priority-pill').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('#task-priority-pills .priority-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
      });
    }, 50);
  }

  function showEditModal(task) {
    const skillOpts = `<option value="">— Nenhuma —</option>` +
      s.skills.map(sk => `<option value="${sk.id}" ${sk.id === task.skillId ? 'selected' : ''}>${sk.name}</option>`).join('');

    const statusOpts = COLUMNS.map(c =>
      `<option value="${c.id}" ${c.id === task.status ? 'selected' : ''}>${c.label}</option>`
    ).join('');

    App.showModal('Editar Tarefa', `
      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" class="form-input" id="etask-title" value="${escHtml(task.title)}" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">Descrição <span style="color:var(--text-dim)">opcional</span></label>
        <textarea class="form-input" id="etask-desc" rows="2" style="resize:vertical; min-height:60px">${escHtml(task.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Prioridade</label>
        <div class="priority-pills" id="etask-priority-pills">
          ${PRIORITIES.map(p => `
            <button type="button" class="priority-pill ${p.id === task.priority ? 'active' : ''}" data-prio="${p.id}" style="--pill-color:${p.color}">
              <span class="priority-dot" style="background:${p.color}"></span>${p.label}
            </button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Coluna</label>
        <select class="form-select" id="etask-status">${statusOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Habilidade <span style="color:var(--text-dim)">opcional</span></label>
        <select class="form-select" id="etask-skill">${skillOpts}</select>
      </div>
    `, () => {
      const title = document.getElementById('etask-title').value.trim();
      if (!title) return;
      const activePill = document.querySelector('#etask-priority-pills .priority-pill.active');
      const newStatus = document.getElementById('etask-status').value;

      task.title       = title;
      task.description = document.getElementById('etask-desc').value.trim();
      task.priority    = activePill ? activePill.dataset.prio : task.priority;
      task.skillId     = document.getElementById('etask-skill').value || null;
      if (newStatus !== task.status) {
        task.status = newStatus;
        if (newStatus === 'done') task.doneAt = new Date().toISOString();
        else task.doneAt = null;
      }

      App.save();
      App.closeModal();
      render();
    });

    setTimeout(() => {
      document.querySelectorAll('#etask-priority-pills .priority-pill').forEach(btn => {
        btn.onclick = () => {
          document.querySelectorAll('#etask-priority-pills .priority-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
      });
    }, 50);
  }

  // ---- Actions ----
  function moveTask(id, dir) {
    const task = s.tasks.find(t => t.id === id);
    if (!task) return;
    const colIdx = COLUMNS.findIndex(c => c.id === task.status);
    const next = COLUMNS[colIdx + dir];
    if (!next) return;
    task.status = next.id;
    if (next.id === 'done') task.doneAt = new Date().toISOString();
    else task.doneAt = null;
    App.save();
    render();
  }

  function deleteTask(id) {
    const idx = s.tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    s.tasks.splice(idx, 1);
    App.save();
    render();
  }

  // ---- Helpers ----
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function skillDot(color) {
    return `<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="${color}"/></svg>`;
  }

  render();
};
