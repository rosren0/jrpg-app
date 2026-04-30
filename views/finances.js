// views/finances.js — Tela de Finanças (standardized)

Views.finances = function(app, ctx) {
  const s = App.state;
  let filterMonth = new Date().getMonth();
  let filterYear = new Date().getFullYear();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function render() {
    const entries = s.finances.entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalIn = entries.filter(e => e.type === 'receita').reduce((a, e) => a + e.value, 0);
    const totalOut = entries.filter(e => e.type === 'despesa').reduce((a, e) => a + e.value, 0);
    const bal = totalIn - totalOut;

    app.innerHTML = `
      <h2 class="view-title">Finanças</h2>
      <div class="card card-glow">
        <div class="balance-display">
          <div class="balance-label">Balanço do Mês</div>
          <div class="balance-value ${bal >= 0 ? 'balance-positive' : 'balance-negative'}">${App.formatCurrency(bal)}</div>
        </div>
        <div style="display:flex; justify-content:center; gap:24px; font-size:12px">
          <div style="text-align:center"><div style="color:var(--accent-green); font-weight:700">${App.formatCurrency(totalIn)}</div><div style="color:var(--text-dim); font-size:10px">Receitas</div></div>
          <div style="text-align:center"><div style="color:var(--accent-red); font-weight:700">${App.formatCurrency(totalOut)}</div><div style="color:var(--text-dim); font-size:10px">Despesas</div></div>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0">
        <div style="display:flex; align-items:center; gap:8px">
          <button class="btn btn-sm btn-icon" id="prev-m">${Icon.chevronLeft(14)}</button>
          <span style="font-size:13px; font-weight:600; min-width:140px; text-align:center">${monthNames[filterMonth]} ${filterYear}</span>
          <button class="btn btn-sm btn-icon" id="next-m">${Icon.chevronRight(14)}</button>
        </div>
        <div style="display:flex; gap:8px">
          <button class="btn btn-green btn-sm" id="add-in">${Icon.circleUp(14)} Receita</button>
          <button class="btn btn-red btn-sm" id="add-out">${Icon.circleDown(14)} Despesa</button>
        </div>
      </div>
      <div class="section-header">Movimentações</div>
      <div class="card">
        ${entries.length > 0 ? entries.map(e => `
          <div class="finance-entry">
            <div class="finance-icon">${e.type==='receita' ? Icon.circleUp(18,'var(--accent-green)') : Icon.circleDown(18,'var(--accent-red)')}</div>
            <div class="finance-info"><div class="finance-desc">${e.description}</div><div class="finance-date">${App.formatDate(e.date)}</div></div>
            <div class="finance-value ${e.type==='receita'?'income':'expense'}">${e.type==='receita'?'+':'-'}${App.formatCurrency(e.value)}</div>
            <button class="btn btn-sm btn-icon" data-del="${e.id}" style="padding:4px 8px; margin-left:4px">${Icon.close(12)}</button>
          </div>`).join('') : `<div class="empty-state"><div class="empty-icon">${Icon.coins(32,'var(--text-dim)')}</div><div class="empty-text">Nenhuma movimentação</div></div>`}
      </div>`;

    document.getElementById('prev-m').onclick = () => { filterMonth--; if(filterMonth<0){filterMonth=11;filterYear--;} render(); };
    document.getElementById('next-m').onclick = () => { filterMonth++; if(filterMonth>11){filterMonth=0;filterYear++;} render(); };
    document.getElementById('add-in').onclick = () => showModal('receita');
    document.getElementById('add-out').onclick = () => showModal('despesa');
    app.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); s.finances.entries = s.finances.entries.filter(en => en.id !== b.dataset.del); App.save(); render();
    }));
    renderCtx();
  }

  function renderCtx() {
    const all = s.finances.entries;
    const total = all.reduce((a,e) => a + (e.type==='receita'?e.value:-e.value), 0);
    const recent = all.sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,5);
    ctx.innerHTML = `
      <div class="context-section">
        <div class="context-title">Resumo Geral</div>
        <div class="card" style="text-align:center; padding:20px">
          <div class="balance-label">Balanço Total</div>
          <div class="balance-value ${total>=0?'balance-positive':'balance-negative'}" style="font-size:22px">${App.formatCurrency(total)}</div>
        </div>
      </div>
      <div class="context-section">
        <div class="context-title">Recentes</div>
        <div class="card">${recent.length>0 ? recent.map(e => `
          <div class="stat-row">
            <span class="stat-row-label">${e.type==='receita'?Icon.circleUp(14,'var(--accent-green)'):Icon.circleDown(14,'var(--accent-red)')} ${e.description}</span>
            <span class="stat-row-value" style="color:${e.type==='receita'?'var(--accent-green)':'var(--accent-red)'}">${e.type==='receita'?'+':'-'}${App.formatCurrency(e.value)}</span>
          </div>`).join('') : '<div class="empty-state"><div class="empty-text">Sem movimentações</div></div>'}</div>
      </div>`;
  }

  function showModal(type) {
    App.showModal(`Nova ${type==='receita'?'Receita':'Despesa'}`, `
      <div class="form-group"><label class="form-label">Descrição</label><input type="text" class="form-input" id="fin-desc" placeholder="Ex: Salário" autofocus /></div>
      <div class="form-group"><label class="form-label">Valor (R$)</label><input type="number" class="form-input" id="fin-val" placeholder="0.00" step="0.01" min="0" /></div>
      <div class="form-group"><label class="form-label">Data</label><input type="date" class="form-input" id="fin-date" value="${new Date().toISOString().split('T')[0]}" /></div>
    `, () => {
      const desc = document.getElementById('fin-desc').value.trim();
      const val = parseFloat(document.getElementById('fin-val').value);
      if (!desc||!val||val<=0) return;
      s.finances.entries.push({id:App.genId(),type,description:desc,value:val,date:document.getElementById('fin-date').value});
      App.save(); App.closeModal(); render();
    });
  }

  render();
};
