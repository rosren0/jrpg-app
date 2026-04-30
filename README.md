# JRPG Productivity App

Sistema de produtividade gamificado estilo JRPG.

## Como hospedar no GitHub Pages

1. Crie um novo repositório no seu GitHub.
2. Suba todos os arquivos desta pasta para o repositório.
3. Vá em **Settings** > **Pages**.
4. Em **Branch**, selecione `main` (ou a sua branch principal) e a pasta `/ (root)`. Clique em **Save**.
5. O GitHub fornecerá uma URL (ex: `https://seu-usuario.github.io/seu-repo/`).

### Configuração importante no Supabase

Para o login funcionar na versão online:
1. Vá ao painel do [Supabase](https://supabase.com).
2. Selecione seu projeto > **Authentication** > **URL Configuration**.
3. Adicione a URL do seu site no GitHub Pages em **Redirect URLs**.

---

## Recursos Implementados
- [x] Gamificação JRPG (Nível, XP, Streak).
- [x] IA DeepSeek para avaliação de atividades e missões.
- [x] Persistência dupla (Supabase + LocalStorage).
- [x] Layout responsivo (Mobile/Tablet/Desktop).
- [x] Novo sistema de Missões Diárias.
