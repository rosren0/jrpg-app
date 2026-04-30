// ai.js — DeepSeek AI integration
// Evaluates activities (assigns XP + description) and suggests missions

const AI = {
  STORAGE_KEY: 'jrpg-deepseek-key',
  MODEL: 'deepseek-chat',
  ENDPOINT: 'https://api.deepseek.com/chat/completions',

  getApiKey() {
    // Migrate from old Gemini key if present
    const old = localStorage.getItem('jrpg-gemini-key');
    if (old && !localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, old);
      localStorage.removeItem('jrpg-gemini-key');
    }
    return localStorage.getItem(this.STORAGE_KEY) || '';
  },

  setApiKey(key) {
    if (key) {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  },

  isConfigured() {
    return !!this.getApiKey();
  },

  async _call(messages) {
    const key = this.getApiKey();
    if (!key) return null;

    try {
      const res = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages,
          max_tokens: 300,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('DeepSeek API error:', res.status, err?.error?.message || '');
        return null;
      }

      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.warn('AI call failed:', e);
      return null;
    }
  },

  // Evaluate an activity and return { xp: number, description: string }
  // XP range: 10–150 based on effort/impact
  async evaluateActivity(activity, skillName) {
    const prompt = `Você é o mestre de jogo de um sistema de produtividade gamificado estilo JRPG.

O jogador completou uma atividade. Avalie o esforço e atribua XP justo.

Regras de XP:
- 10–30 XP: atividade pequena, rápida ou de baixo esforço (ex: 5 minutos de leitura)
- 31–60 XP: atividade moderada, 30–60 minutos de foco
- 61–100 XP: atividade significativa, esforço considerável (ex: 2h de estudo intenso)
- 101–150 XP: conquista grande, sessão longa ou muito difícil

Habilidade: ${skillName}
Atividade relatada pelo jogador: ${activity}

Responda APENAS com JSON válido:
{"xp": <número inteiro entre 10 e 150>, "description": "<narrativa motivadora de 1-2 frases, sem aspas internas>"}`;

    const content = await this._call([
      { role: 'system', content: 'Você é o mestre de um jogo de produtividade JRPG. Responda apenas com JSON válido.' },
      { role: 'user', content: prompt }
    ]);

    if (!content) return null;

    try {
      const parsed = JSON.parse(content);
      if (typeof parsed.xp === 'number' && typeof parsed.description === 'string') {
        parsed.xp = Math.max(10, Math.min(150, Math.round(parsed.xp)));
        parsed.description = parsed.description.replace(/^["']|["']$/g, '').trim();
        return parsed;
      }
    } catch (e) {
      console.warn('AI parse error:', e, content);
    }
    return null;
  },

  // Suggest 3 daily missions based on player's skills and recent activity
  async suggestMissions(skills, recentLogs) {
    const skillList = skills.map(s => `${s.name} (id: ${s.id})`).join(', ');
    const recentActivity = recentLogs.slice(0, 5)
      .map(l => `${l.skillName}: ${l.description}`)
      .join('\n') || 'Nenhuma atividade recente';

    const prompt = `Você é o mestre de jogo de um sistema de produtividade gamificado estilo JRPG.

Sugira 3 missões diárias para o jogador com base nas habilidades e atividades recentes.

Habilidades disponíveis: ${skillList}
Atividades recentes do jogador:
${recentActivity}

Regras das missões:
- Cada missão deve ser alcançável em 1 dia
- Seja específico, concreto e motivador (ex: "Estudar matemática por 45 minutos" em vez de "Estudar")
- Distribua entre habilidades diferentes quando possível
- XP entre 30 e 120, proporcional à dificuldade

Responda APENAS com JSON válido:
{"missions": [{"title": "<missão>", "skillId": "<id exato da skill>", "xpReward": <número>}]}`;

    const content = await this._call([
      { role: 'system', content: 'Você é o mestre de um jogo de produtividade JRPG. Responda apenas com JSON válido.' },
      { role: 'user', content: prompt }
    ]);

    if (!content) return null;

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.missions)) {
        return parsed.missions.map(m => ({
          ...m,
          xpReward: Math.max(30, Math.min(120, Math.round(m.xpReward || 50)))
        }));
      }
    } catch (e) {
      console.warn('AI missions parse error:', e, content);
    }
    return null;
  }
};
