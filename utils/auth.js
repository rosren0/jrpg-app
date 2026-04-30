// auth.js — Authentication with Supabase (Google OAuth or offline)

const Auth = {
  currentUser: null,
  onAuthReady: null,

  init(callback) {
    this.onAuthReady = callback;

    if (!isSupabaseConfigured()) {
      this.enterOffline();
      return;
    }

    if (!initSupabase()) {
      this.enterOffline();
      return;
    }

    // Check for existing session and listen for changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUser = session.user;
        this.hideLogin();
        if (this.onAuthReady) this.onAuthReady(session.user);
        this.onAuthReady = null; // prevent double-fire
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.showLogin();
      }
    });

    // Initial session check
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        this.showLogin();
      }
      // If session exists, onAuthStateChange will fire
    });
  },

  _ensureClient() {
    if (supabaseClient) return true;
    if (typeof isSupabaseConfigured === 'function' && !isSupabaseConfigured()) {
      alert('Por favor, configure as credenciais do Supabase no arquivo utils/supabase-config.js antes de conectar à nuvem.');
      return false;
    }
    if (typeof initSupabase === 'function') {
      return initSupabase();
    }
    return false;
  },

  async signInWithApple() {
    if (!this._ensureClient()) return;
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.href }
      });
      if (error) alert('Erro no login Apple: ' + error.message);
    } catch (e) {
      console.error('Login error:', e);
    }
  },

  async signInWithEmail(email, password) {
    if (!this._ensureClient()) return { error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert('Erro ao entrar: ' + error.message);
      return { data, error };
    } catch (e) {
      alert('Erro inesperado: ' + e.message);
      return { error: e };
    }
  },

  async signUpWithEmail(email, password) {
    if (!this._ensureClient()) return { error: new Error('Supabase not configured') };
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      if (error) alert('Erro ao cadastrar: ' + error.message);
      else alert('Verifique seu email para confirmar o cadastro!');
      return { data, error };
    } catch (e) {
      alert('Erro inesperado: ' + e.message);
      return { error: e };
    }
  },

  async signOut() {
    try {
      if (supabaseClient) await supabaseClient.auth.signOut();
      this.currentUser = null;
      this.onAuthReady = (user) => App.boot(user);
      this.showLogin();
    } catch (e) {
      console.error('Logout error:', e);
    }
  },

  enterOffline() {
    this.currentUser = null;
    this.hideLogin();
    if (this.onAuthReady) this.onAuthReady(null);
    this.onAuthReady = null;
  },

  showLogin(mode = 'signin') {
    const root = document.getElementById('login-root');
    if (!root) return;
    
    const isSignIn = mode === 'signin';
    
    root.innerHTML = `
      <div class="login-screen">
        <div class="login-modal-box">
          <div class="login-logo-container">
            <div class="login-logo">JRPG</div>
            <div class="login-sub">PRODUCTIVITY SYSTEM</div>
          </div>
          
          <div class="login-content">
            <div class="login-auth-tabs">
              <div class="auth-tab ${isSignIn ? 'active' : ''}" id="tab-signin">Entrar</div>
              <div class="auth-tab ${!isSignIn ? 'active' : ''}" id="tab-signup">Criar Conta</div>
            </div>

            <form class="login-form" id="auth-form">
              <div class="form-group">
                <input type="email" id="auth-email" class="form-input" placeholder="Seu email" required />
              </div>
              <div class="form-group">
                <input type="password" id="auth-password" class="form-input" placeholder="Sua senha" required />
              </div>
              <button type="submit" class="btn-auth-submit">
                ${isSignIn ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
              </button>
            </form>

            <div class="login-divider"><span>ou use</span></div>
            
            <button class="login-btn-apple-sm" id="login-apple">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.182 4.347c-.612.752-1.615 1.236-2.522 1.236-.124 0-.252-.01-.36-.024.018-.902.506-1.892 1.156-2.65.65-.758 1.666-1.258 2.512-1.258.122 0 .242.012.355.023-.01.95-.49 1.921-1.14 2.673zm4.514 14.674c-.783 1.128-1.583 2.251-2.844 2.251-1.213 0-1.604-.741-2.99-.741-1.386 0-1.84.72-2.99.72-1.253 0-2.145-1.221-2.928-2.349-1.603-2.311-2.435-6.525-2.435-8.384 0-3.18 1.933-4.869 3.844-4.869 1.054 0 1.95.733 2.593.733.64 0 1.67-.745 2.87-.745 1.233 0 2.316.637 2.893 1.48-.12.072-2.203 1.285-2.203 3.844 0 3.06 2.654 4.14 2.69 4.156-.025.076-.423 1.464-1.41 2.914z"/>
              </svg>
              Continuar com Apple
            </button>
            
            <div class="login-offline-action" id="login-offline" style="margin-top: 20px;">
              Modo Offline (apenas local)
            </div>
          </div>
        </div>
      </div>`;

    // Handlers
    document.getElementById('tab-signin').onclick = () => this.showLogin('signin');
    document.getElementById('tab-signup').onclick = () => this.showLogin('signup');
    document.getElementById('login-apple').onclick = () => this.signInWithApple();
    document.getElementById('login-offline').onclick = () => this.enterOffline();

    document.getElementById('auth-form').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const pass = document.getElementById('auth-password').value;
      const submitBtn = e.target.querySelector('button');
      
      submitBtn.disabled = true;
      submitBtn.innerText = 'Processando...';
      
      if (isSignIn) {
        await this.signInWithEmail(email, pass);
      } else {
        await this.signUpWithEmail(email, pass);
      }
      
      submitBtn.disabled = false;
      submitBtn.innerText = isSignIn ? 'Entrar no Sistema' : 'Finalizar Cadastro';
    };
  },

  hideLogin() {
    const root = document.getElementById('login-root');
    if (root) root.innerHTML = '';
  }
};
