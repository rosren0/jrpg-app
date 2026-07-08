// utils/export.js — Data export (CSV + JSON)

const Export = {
  _download(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  _toCSV(headers, rows) {
    const escape = v => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.map(escape).join(',')];
    for (const row of rows) lines.push(row.map(escape).join(','));
    return lines.join('\r\n');
  },

  logs() {
    const s = App.state;
    const csv = this._toCSV(
      ['Data', 'Hora', 'Habilidade', 'XP', 'Descrição', 'IA'],
      s.logs.map(l => {
        const d = new Date(l.timestamp);
        return [
          d.toLocaleDateString('pt-BR'),
          d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          l.skillName,
          l.xp,
          l.description,
          l.aiGenerated ? 'Sim' : 'Não',
        ];
      })
    );
    this._download(`jrpg-logs-${this._today()}.csv`, csv, 'text/csv');
  },

  finances() {
    const s = App.state;
    const csv = this._toCSV(
      ['Data', 'Tipo', 'Descrição', 'Valor (R$)'],
      [...s.finances.entries]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(e => [
          new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR'),
          e.type === 'receita' ? 'Receita' : 'Despesa',
          e.description,
          (e.type === 'despesa' ? -e.value : e.value).toFixed(2),
        ])
    );
    this._download(`jrpg-financas-${this._today()}.csv`, csv, 'text/csv');
  },

  skills() {
    const s = App.state;
    const csv = this._toCSV(
      ['Habilidade', 'Nível', 'XP Total', 'XP Atual no Nível', 'XP para Próximo Nível'],
      s.skills.map(sk => {
        const info = XP.calc(sk.xp);
        return [sk.name, info.level, sk.xp, info.currentXP, info.nextLevelXP];
      })
    );
    this._download(`jrpg-habilidades-${this._today()}.csv`, csv, 'text/csv');
  },

  full() {
    const json = JSON.stringify(App.state, null, 2);
    this._download(`jrpg-backup-${this._today()}.json`, json, 'application/json');
  },

  importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = () => {
      const file = input.files[0];
      document.body.removeChild(input);
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        let parsed;
        try {
          parsed = JSON.parse(e.target.result);
        } catch {
          alert('Arquivo inválido. Certifique-se de usar um backup JSON gerado por este app.');
          return;
        }

        // Basic structure validation
        const required = ['player', 'skills', 'inventory', 'finances', 'logs', 'missions'];
        const missing = required.filter(k => !(k in parsed));
        if (missing.length) {
          alert(`JSON inválido. Campos ausentes: ${missing.join(', ')}`);
          return;
        }

        // Build summary for confirmation modal
        const skillLevels = (parsed.skills || []).map(s => `${s.name} Nv.${s.level}`).join(', ');
        const logCount    = (parsed.logs || []).length;
        const missionCount = (parsed.missions || []).length;
        const taskCount   = (parsed.tasks || []).length;

        App.showModal('Importar Backup', `
          <div style="text-align:center; padding:4px 0 12px">
            <div style="font-size:28px; margin-bottom:10px">📂</div>
            <div style="font-size:13px; font-weight:600; margin-bottom:4px">Arquivo: ${file.name}</div>
            <div style="font-size:11px; color:var(--text-dim); margin-bottom:16px">${(file.size/1024).toFixed(1)} KB</div>
          </div>
          <div style="font-size:12px; color:var(--text-muted); line-height:1.8">
            <div>👤 Jogador: <strong style="color:var(--text-primary)">${parsed.player?.name || '—'}</strong></div>
            <div>⚔️ Habilidades: <strong style="color:var(--text-primary)">${skillLevels || '—'}</strong></div>
            <div>📋 Logs: <strong style="color:var(--text-primary)">${logCount}</strong></div>
            <div>🎯 Missões: <strong style="color:var(--text-primary)">${missionCount}</strong></div>
            ${taskCount > 0 ? `<div>📌 Tarefas Kanban: <strong style="color:var(--text-primary)">${taskCount}</strong></div>` : ''}
          </div>
          <div style="margin-top:14px; padding:10px; background:rgba(255,107,107,0.06); border-radius:6px; font-size:11px; color:var(--accent-red)">
            ⚠️ Isso vai <strong>substituir</strong> todos os seus dados atuais.
          </div>
        `, () => {
          // Ensure tasks field exists (backward compat)
          if (!parsed.tasks) parsed.tasks = [];
          App.state = parsed;
          Storage.save(App.state);
          App.ensureFields();
          App.closeModal();
          App.navigate('overview');
          App.updateHeader();
        });

        // Style the confirm button
        setTimeout(() => {
          const btn = document.getElementById('modal-confirm');
          if (btn) btn.textContent = 'Importar e restaurar';
        }, 10);
      };

      reader.readAsText(file);
    };

    input.click();
  },

  _today() {
    return new Date().toISOString().split('T')[0];
  },
};
