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

  _today() {
    return new Date().toISOString().split('T')[0];
  },
};
