// xp.js — Sistema de XP e Level (global)

const XP = {
  // XP necessário para ir do nível N para N+1
  forLevel(level) { return 100 * level; },

  // Calcula nível e progresso a partir do XP total
  calc(totalXP) {
    let level = 1, remaining = totalXP;
    while (remaining >= this.forLevel(level)) {
      remaining -= this.forLevel(level);
      level++;
    }
    const needed = this.forLevel(level);
    return { level, currentXP: remaining, nextLevelXP: needed, progress: remaining / needed };
  },

  // Adiciona XP e retorna resultado com info de level up
  add(skill, amount) {
    const before = this.calc(skill.xp);
    skill.xp += amount;
    const after = this.calc(skill.xp);
    skill.level = after.level;
    return { skill, xpGained: amount, leveledUp: after.level > before.level, oldLevel: before.level, newLevel: after.level, ...after };
  },

  // Nível geral do jogador (média)
  playerLevel(skills) {
    if (!skills.length) return 1;
    const sum = skills.reduce((a, s) => a + this.calc(s.xp).level, 0);
    return Math.floor(sum / skills.length);
  },

  // XP total do jogador
  playerTotalXP(skills) {
    return skills.reduce((a, s) => a + s.xp, 0);
  },

  // Progresso geral do nível do jogador
  playerProgress(skills) {
    const lvl = this.playerLevel(skills);
    const totalXP = this.playerTotalXP(skills);
    const prevTotal = skills.length * this.totalXPForLevel(lvl);
    const nextTotal = skills.length * this.totalXPForLevel(lvl + 1);
    if (nextTotal === prevTotal) return 0;
    return Math.min(1, (totalXP - prevTotal) / (nextTotal - prevTotal));
  },

  totalXPForLevel(level) {
    let t = 0;
    for (let i = 1; i < level; i++) t += this.forLevel(i);
    return t;
  }
};
