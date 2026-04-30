# Supabase + Layout + AI Logs

Três mudanças: migrar persistência para Supabase, padronizar layout, e integrar IA para logs.

---

## 1. Supabase (substituindo Firebase)

### Setup necessário (no dashboard Supabase)
1. Criar projeto em [supabase.com](https://supabase.com)
2. Ativar **Authentication → Google provider** (precisa de Client ID/Secret do Google Cloud)
3. Copiar **Project URL** e **anon key** (Settings → API)
4. Criar tabela `user_data` no SQL Editor:

```sql
CREATE TABLE user_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuário só acessa seus próprios dados
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON user_data FOR UPDATE USING (auth.uid() = user_id);
```

### Mudanças no código

#### [MODIFY] [index.html](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/index.html)
- Trocar Firebase SDK por Supabase CDN (`@supabase/supabase-js@2`)
- Remover scripts do Firebase

#### [MODIFY] [firebase-config.js → supabase-config.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/utils/firebase-config.js)
- Renomear para `supabase-config.js`
- Inicializar com `supabase.createClient(URL, ANON_KEY)`

#### [MODIFY] [auth.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/utils/auth.js)
- `signInWithOAuth({ provider: 'google' })` via Supabase
- Listener `onAuthStateChange`
- Mesmo fluxo visual (login screen + modo offline)

#### [MODIFY] [storage.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/utils/storage.js)
- Save: `upsert` no Supabase + localStorage
- Load: `select` do Supabase, fallback localStorage
- Sem real-time listener (Supabase free tier não tem websockets robustos — puxa dados no login)

---

## 2. Padronização de Layout

### Problemas identificados
- Inline styles inconsistentes entre views (section headers com estilos diferentes)
- Cada view usa padrões ligeiramente diferentes para headers de seção
- A seção "Ações Rápidas" usa div com style, enquanto Skills e Inventário usam classes CSS

### Solução: padronizar com classes CSS

Criar classes reutilizáveis:
- `.section-header` → label de seção (ex: "Resumo das Habilidades", "Ações Rápidas")
- `.card-header` → header dentro de um card com ícone + título + ação
- `.stat-row` → linha de estatística (label + valor) — substituindo o `.inv-stat` genérico

Aplicar em **todas as 5 views** para consistência visual.

#### [MODIFY] [styles.css](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/styles.css)
- Adicionar `.section-header`, `.card-header`, `.stat-row`
- Limpar estilos redundantes

#### [MODIFY] Todas as views
- Substituir inline styles por classes CSS padronizadas
- Garantir que headers, cards, e espaçamentos sejam idênticos

---

## 3. Integração IA para Logs (Gemini API)

### Conceito
Quando o usuário registra um hábito com descrição curta (ex: "Estudei física"), a IA gera uma descrição mais completa para o log automático.

### API: Google Gemini (gratuita)
- **Modelo**: `gemini-2.0-flash-lite` (gratuito, rápido)
- **Endpoint REST**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=API_KEY`
- **Setup**: Obter API key em [aistudio.google.com](https://aistudio.google.com)

### Fluxo
1. Usuário registra: skill "Estudo" + descrição "Estudei física 2h"
2. App envia para Gemini: *"Gere uma descrição de log curta (1-2 frases) para um sistema de produtividade gamificado. Atividade: Estudei física 2h. Habilidade: Estudo."*
3. Gemini retorna: *"Sessão de estudo de física com foco em exercícios e teoria. Progresso sólido."*
4. Log salvo com descrição gerada

### Configuração
- API key armazenada em `localStorage` (configurável pelo usuário)
- **Opcional**: se a key não está configurada, usa a descrição manual do usuário
- Sem API key = funciona normalmente sem IA

#### [NEW] [utils/ai.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/utils/ai.js)
- Função `generateLogDescription(activity, skillName)` → chama Gemini REST
- Fallback para descrição manual se falhar

#### [MODIFY] [views/skills.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/views/skills.js)
- Após registro, chama IA para gerar descrição do log (se API key configurada)

#### [MODIFY] [views/overview.js](file:///Users/renantrab/Library/Mobile%20Documents/com~apple~CloudDocs/Downloads/jrpg-app/views/overview.js)
- Seção no context para configurar API key do Gemini (campo de texto)

---

## User Review Required

> [!IMPORTANT]
> **Supabase requer Google OAuth credentials.** Para o login com Google funcionar, você precisará de um Client ID e Client Secret do Google Cloud Console, além de configurá-los no dashboard do Supabase. É mais burocrático que o Firebase mas funciona da mesma forma. Quer prosseguir com Google login ou prefere **email/senha simples** (mais rápido de configurar)?

> [!WARNING]
> **API Key do Gemini no frontend.** A API key ficará visível no browser. Para uso pessoal isso é aceitável, mas não é seguro para uso público. A key será armazenada no localStorage do usuário e nunca será compartilhada.

---

## Verification Plan

### Supabase
- Login com Google (ou email) → dados carregados do Supabase
- Registrar hábito → verificar que salvou na tabela `user_data`
- Abrir em outro dispositivo → dados iguais

### Layout
- Comparar visualmente todas as 5 telas: headers, cards, espaçamentos consistentes
- Testar em desktop e mobile

### AI Logs
- Configurar API key → registrar hábito → verificar que log tem descrição gerada
- Sem API key → funciona com descrição manual
