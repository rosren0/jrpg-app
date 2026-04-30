// supabase-config.js — Supabase initialization
// INSTRUCTIONS: Replace the values below with your Supabase project credentials.
// Get them from: https://supabase.com → Project Settings → API

const SUPABASE_URL = 'https://qxnysunzepgmpfkunejp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bnlzdW56ZXBnbXBma3VuZWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTc5OTMsImV4cCI6MjA5MzAzMzk5M30.dqeXCwaEcdrVa3O2BF2tEpS_s6ARXmNIbQwvWQgKTqo';

let supabaseClient = null;

function initSupabase() {
  try {
    if (typeof supabase === 'undefined') {
      console.warn('Supabase SDK not loaded');
      return false;
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (e) {
    console.warn('Supabase init failed:', e);
    return false;
  }
}

function isSupabaseConfigured() {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}
