// storage.js — Dual persistence: localStorage + Supabase

const STORAGE_KEY = 'jrpg-productivity-state';

const Storage = {
  uid: null,

  setUser(uid) { this.uid = uid; },

  // Save to localStorage + Supabase
  save(state) {
    // Always save locally
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('localStorage save error:', e); }

    // Save to Supabase if authenticated
    if (this.uid && supabaseClient) {
      supabaseClient.from('user_data').upsert({
        user_id: this.uid,
        state: state,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).then(({ error }) => {
        if (error) console.warn('Supabase save error:', error.message);
      });
    }
  },

  // Load from Supabase (preferred) or localStorage (fallback)
  async loadAsync() {
    console.log('[Storage] loadAsync — uid:', this.uid, '| supabaseClient:', !!supabaseClient);
    if (this.uid && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('user_data')
          .select('state')
          .eq('user_id', this.uid)
          .single();

        console.log('[Storage] Supabase result — data:', data, '| error:', error);

        if (!error && data?.state) {
          const cloudState = typeof data.state === 'string' ? JSON.parse(data.state) : data.state;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          return cloudState;
        }
      } catch (e) {
        console.warn('Supabase load error, falling back to localStorage:', e);
      }
    }
    console.log('[Storage] falling back to localStorage');
    return this.loadLocal();
  },

  loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('localStorage load error:', e); }
    return null;
  },

  // Backward compatibility
  load() { return this.loadLocal(); },

  clear() { localStorage.removeItem(STORAGE_KEY); }
};
