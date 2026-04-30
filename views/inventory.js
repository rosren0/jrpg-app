// views/inventory.js — Tela de Inventário (standardized)

Views.inventory = function(app, ctx) {
  const s = App.state;
  let activeTab = 'all';
  let selectedItemId = null;

  const locations = [
    { id: 'all', label: 'Tudo', icon: () => Icon.list(14) },
    { id: 'comigo', label: 'Comigo', icon: () => Icon.bag(14) },
    { id: 'casa', label: 'Casa', icon: () => Icon.home(14) },
    { id: 'trabalho', label: 'Trabalho', icon: () => Icon.briefcase(14) },
    { id: 'outro', label: 'Outro', icon: () => Icon.mapPin(14) }
  ];
  const categories = ['Documento','Eletrônico','Ferramenta','Pessoal','Outro'];

  function render() {
    const filtered = activeTab === 'all' ? s.inventory : s.inventory.filter(i => i.location === activeTab);

    const tabsHTML = locations.map(l =>
      `<div class="tab ${activeTab === l.id ? 'active' : ''}" data-tab="${l.id}" style="display:flex; align-items:center; gap:4px">${l.icon()} ${l.label}</div>`
    ).join('');

    const itemsHTML = filtered.length > 0 ? filtered.map(item => `
      <div class="list-item ${selectedItemId === item.id ? 'selected' : ''}" data-item="${item.id}">
        <div style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; color:var(--text-muted)">${Icon.catIcon(item.category, 18)}</div>
        <div style="flex:1">
          <div style="font-weight:600; font-size:13px">${item.name}</div>
          <div style="font-size:10px; color:var(--text-dim)">${item.category} · ${locations.find(l=>l.id===item.location)?.label || item.location}</div>
        </div>
      </div>`).join('') : `
      <div class="empty-state">
        <div class="empty-icon">${Icon.bag(32, 'var(--text-dim)')}</div>
        <div class="empty-text">Nenhum item${activeTab !== 'all' ? ' neste local' : ''}</div>
      </div>`;

    app.innerHTML = `
      <h2 class="view-title">Inventário</h2>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
        <div class="tabs">${tabsHTML}</div>
        <button class="btn btn-primary" id="add-item-btn">${Icon.plus(14)} Novo Item</button>
      </div>
      <div class="card">${itemsHTML}</div>`;

    app.querySelectorAll('[data-tab]').forEach(t => {
      t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); });
    });
    app.querySelectorAll('[data-item]').forEach(el => {
      el.addEventListener('click', () => { selectedItemId = el.dataset.item; render(); renderContext(); });
    });
    document.getElementById('add-item-btn').onclick = () => showAddModal();
    renderContext();
  }

  function renderContext() {
    const item = s.inventory.find(i => i.id === selectedItemId);
    const countByLoc = {};
    locations.filter(l => l.id !== 'all').forEach(l => { countByLoc[l.id] = s.inventory.filter(i => i.location === l.id).length; });

    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title">Detalhes</div>
        ${item ? `
          <div class="card">
            <div style="text-align:center; margin-bottom:12px; color:var(--accent-blue)">${Icon.catIcon(item.category, 32)}</div>
            <div style="font-weight:700; font-size:15px; text-align:center; margin-bottom:12px">${item.name}</div>
            <div class="stat-row"><span class="stat-row-label">Categoria</span><span class="stat-row-value">${item.category}</span></div>
            <div class="stat-row"><span class="stat-row-label">Local</span><span class="stat-row-value">${locations.find(l=>l.id===item.location)?.label || item.location}</span></div>
            <div class="stat-row"><span class="stat-row-label">Adicionado</span><span class="stat-row-value">${App.formatDate(item.addedAt)}</span></div>
            ${item.notes ? `<div style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border); font-size:12px; color:var(--text-muted)">${item.notes}</div>` : ''}
            <div style="margin-top:14px; display:flex; gap:8px">
              <button class="btn btn-sm" id="edit-item-btn" style="flex:1">${Icon.edit(14)} Editar</button>
              <button class="btn btn-sm btn-red" id="del-item-btn">${Icon.trash(14)}</button>
            </div>
          </div>` : `
          <div class="card"><div class="empty-state"><div class="empty-text">Selecione um item</div></div></div>`}
      </div>
      <div class="context-section">
        <div class="context-title">Itens por Local</div>
        <div class="card">
          ${locations.filter(l => l.id !== 'all').map(l => `
            <div class="stat-row">
              <span class="stat-row-label">${l.icon()} ${l.label}</span>
              <span class="stat-row-value">${countByLoc[l.id] || 0}</span>
            </div>`).join('')}
          <div class="stat-row stat-row-divider">
            <span class="stat-row-label" style="font-weight:700">Total</span>
            <span class="stat-row-value" style="color:var(--accent-blue)">${s.inventory.length}</span>
          </div>
        </div>
      </div>`;

    if (item) {
      const editBtn = document.getElementById('edit-item-btn');
      const delBtn = document.getElementById('del-item-btn');
      if (editBtn) editBtn.onclick = () => showEditModal(item);
      if (delBtn) delBtn.onclick = () => {
        s.inventory = s.inventory.filter(i => i.id !== item.id);
        selectedItemId = null;
        App.save(); render();
      };
    }
  }

  function showAddModal() {
    App.showModal('Novo Item', `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input type="text" class="form-input" id="item-name" placeholder="Nome do item" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="item-cat">${categories.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Localização</label>
        <select class="form-select" id="item-loc">${locations.filter(l=>l.id!=='all').map(l => `<option value="${l.id}">${l.label}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas (opcional)</label>
        <textarea class="form-textarea" id="item-notes" placeholder="Detalhes sobre o item..."></textarea>
      </div>
    `, () => {
      const name = document.getElementById('item-name').value.trim();
      if (!name) return;
      s.inventory.push({
        id: App.genId(), name,
        category: document.getElementById('item-cat').value,
        location: document.getElementById('item-loc').value,
        notes: document.getElementById('item-notes').value.trim(),
        addedAt: new Date().toISOString()
      });
      App.save(); App.closeModal(); render();
    });
  }

  function showEditModal(item) {
    App.showModal('Editar Item', `
      <div class="form-group">
        <label class="form-label">Nome</label>
        <input type="text" class="form-input" id="edit-name" value="${item.name}" />
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="edit-cat">${categories.map(c => `<option value="${c}" ${c===item.category?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Localização</label>
        <select class="form-select" id="edit-loc">${locations.filter(l=>l.id!=='all').map(l => `<option value="${l.id}" ${l.id===item.location?'selected':''}>${l.label}</option>`).join('')}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="edit-notes">${item.notes||''}</textarea>
      </div>
    `, () => {
      const name = document.getElementById('edit-name').value.trim();
      if (!name) return;
      item.name = name;
      item.category = document.getElementById('edit-cat').value;
      item.location = document.getElementById('edit-loc').value;
      item.notes = document.getElementById('edit-notes').value.trim();
      App.save(); App.closeModal(); render();
    });
  }

  render();
};
