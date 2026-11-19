// Dua mode:
//  - Normal  : memanggil backend Express (/api/...)
//  - Supabase: penyimpanan cloud dan akun lintas perangkat
//  - Statis  : fallback localStorage browser jika Supabase belum dikonfigurasi
import { supabase } from './supabase';

export const STATIC = import.meta.env.VITE_STATIC === 'true' || (!supabase && !import.meta.env.VITE_API_URL);
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const TOKEN_KEY = 'dompetku_token_v2';
const ACCOUNT_KEY = 'dompetku_static_account';
const PROFILE_KEY = 'dompetku_profile';

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || '';
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

const KEY = 'dompetku_static_v1';
const read = () => {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.tx)) return d; } catch { /* abaikan */ }
  return { tx: [], saldoAwal: 0, budget: {}, cats: null };
};

function local(url, method, b) {
  const d = read();
  if (url === '/api/auth/register' && method === 'POST') {
    if (localStorage.getItem(ACCOUNT_KEY)) throw new Error('Email sudah terdaftar');
    const user = { id: 'local', name: String(b.name).trim(), email: String(b.email).trim().toLowerCase(), bio: '', photo: '', cover: '' };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...user, password: b.password }));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    return { token: 'local-session', user };
  }
  if (url === '/api/auth/login' && method === 'POST') {
    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
    if (!account || account.email !== String(b.email).trim().toLowerCase() || account.password !== b.password) throw new Error('Login gagal');
    return { token: 'local-session', user: account };
  }
  if (url === '/api/auth/me' && method === 'GET') {
    const user = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (!user) throw new Error('Login diperlukan');
    return { user };
  }
  if (url === '/api/auth/logout' && method === 'POST') return { ok: true };
  if (url === '/api/profile' && method === 'GET') return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  if (url === '/api/profile' && method === 'PUT') {
    const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || 'null');
    const user = { ...b, id: 'local' };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    if (account) localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...account, name: user.name, email: user.email, bio: user.bio, photo: user.photo }));
    return user;
  }
  if (url === '/api/data' && method === 'GET') return d;
  if (url === '/api/tx' && method === 'POST') {
    const amount = Math.round(Number(b.amount));
    if (!b.id || !['income', 'expense'].includes(b.type) || !(amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !b.cat) throw new Error('Data tidak valid');
    const r = { ...b, amount }, i = d.tx.findIndex((t) => t.id === r.id);
    if (i >= 0) d.tx[i] = r; else d.tx.push(r);
  } else if (url.startsWith('/api/tx/') && method === 'DELETE') {
    const id = decodeURIComponent(url.slice(8)); d.tx = d.tx.filter((t) => t.id !== id);
  } else if (url === '/api/settings' && method === 'PUT') {
    d.saldoAwal = Math.max(0, Number(b.saldoAwal) || 0); d.budget = b.budget || {}; if (b.cats) d.cats = b.cats;
  } else if (url === '/api/rename' && method === 'POST') {
    d.tx = d.tx.map((t) => (t.type === b.type && t.cat === b.from ? { ...t, cat: b.to } : t));
  } else if (url === '/api/restore' && method === 'POST') {
    Object.assign(d, { tx: b.tx, saldoAwal: b.saldoAwal || 0, budget: b.budget || {}, cats: b.cats });
  } else throw new Error('Endpoint tidak dikenal');
  localStorage.setItem(KEY, JSON.stringify(d));
  return { ok: true };
}

const userOrThrow = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Login diperlukan');
  return data.user;
};
const profileShape = (p) => ({
  id: p.id, name: p.name, email: p.email, bio: p.bio || '', photo: p.photo || '', cover: p.cover || '',
  photoScale: p.photo_scale || 1, photoX: p.photo_x || 0, photoY: p.photo_y || 0,
  coverScale: p.cover_scale || 1, coverX: p.cover_x || 0, coverY: p.cover_y || 0,
});
const cloud = async (url, method = 'GET', b) => {
  if (url === '/api/auth/register' && method === 'POST') {
    if (!String(b.name || '').trim() || !/^\S+@\S+\.\S+$/.test(String(b.email || '').trim()) || String(b.password || '').length < 8) throw new Error('Nama, email, atau password tidak valid');
    const { data, error } = await supabase.auth.signUp({ email: b.email.trim().toLowerCase(), password: b.password, options: { data: { name: b.name.trim() } } });
    if (error) throw new Error(error.message);
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error('Email sudah terdaftar');
    if (!data.user || !data.session) throw new Error('Konfirmasi email Supabase diperlukan');
    await supabase.from('profiles').upsert({ id: data.user.id, email: data.user.email, name: b.name.trim() });
    return { token: data.session.access_token, user: { id: data.user.id, name: b.name.trim(), email: data.user.email, bio: '', photo: '', cover: '' } };
  }
  if (url === '/api/auth/login' && method === 'POST') {
    const { data, error } = await supabase.auth.signInWithPassword({ email: b.email.trim().toLowerCase(), password: b.password });
    if (error || !data.session) throw new Error(error?.message || 'Login gagal');
    const p = await cloud('/api/profile');
    return { token: data.session.access_token, user: p };
  }
  if (url === '/api/auth/me') {
    const p = await cloud('/api/profile');
    return { user: p };
  }
  if (url === '/api/auth/logout') { await supabase.auth.signOut(); return { ok: true }; }
  if (url === '/api/profile' && method === 'GET') {
    const user = await userOrThrow();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return profileShape(data);
  }
  if (url === '/api/profile' && method === 'PUT') {
    const user = await userOrThrow();
    const p = { id: user.id, name: b.name.trim(), email: b.email.trim().toLowerCase(), bio: b.bio || '', photo: b.photo || '', cover: b.cover || '', photo_scale: b.photoScale || 1, photo_x: b.photoX || 0, photo_y: b.photoY || 0, cover_scale: b.coverScale || 1, cover_x: b.coverX || 0, cover_y: b.coverY || 0 };
    const { data, error } = await supabase.from('profiles').upsert(p).select().single();
    if (error) throw error;
    return profileShape(data);
  }
  const user = await userOrThrow();
  if (url === '/api/data' && method === 'GET') {
    const [{ data: tx, error: txError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('transactions').select('id,ts,type,amount,cat,sub,date,desc,method').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('settings').select('key,value').eq('user_id', user.id),
    ]);
    if (txError || settingsError) throw txError || settingsError;
    const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    return { tx: tx || [], saldoAwal: s.saldoAwal || 0, budget: s.budget || {}, cats: s.cats || null };
  }
  if (url === '/api/tx' && method === 'POST') {
    const r = cleanTransaction(b);
    const { error } = await supabase.from('transactions').upsert({ ...r, user_id: user.id });
    if (error) throw error;
    return { ok: true };
  }
  if (url.startsWith('/api/tx/') && method === 'DELETE') {
    const { error } = await supabase.from('transactions').delete().eq('user_id', user.id).eq('id', decodeURIComponent(url.slice(8)));
    if (error) throw error;
    return { ok: true };
  }
  if (url === '/api/settings' && method === 'PUT') {
    const rows = [['saldoAwal', Math.max(0, Number(b.saldoAwal) || 0)], ['budget', b.budget || {}]];
    if (b.cats) rows.push(['cats', b.cats]);
    const { error } = await supabase.from('settings').upsert(rows.map(([key, value]) => ({ user_id: user.id, key, value })));
    if (error) throw error;
    return { ok: true };
  }
  if (url === '/api/rename' && method === 'POST') {
    const { data, error } = await supabase.from('transactions').select('id,cat').eq('user_id', user.id).eq('type', b.type).eq('cat', b.from);
    if (error) throw error;
    await Promise.all(data.map((t) => supabase.from('transactions').update({ cat: b.to }).eq('user_id', user.id).eq('id', t.id)));
    return { ok: true };
  }
  if (url === '/api/restore' && method === 'POST') {
    await supabase.from('transactions').delete().eq('user_id', user.id);
    const rows = b.tx.map((t) => ({ ...cleanTransaction(t), user_id: user.id }));
    if (rows.length) await supabase.from('transactions').insert(rows);
    await supabase.from('settings').upsert([['saldoAwal', b.saldoAwal || 0], ['budget', b.budget || {}], ['cats', b.cats]].map(([key, value]) => ({ user_id: user.id, key, value })));
    return { ok: true };
  }
  throw new Error('Endpoint tidak dikenal');
};

const cleanTransaction = (b) => {
  const amount = Math.round(Number(b.amount));
  if (!b.id || !['income', 'expense'].includes(b.type) || !(amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !b.cat) throw new Error('Data tidak valid');
  return { id: b.id, ts: Number(b.ts) || Date.now(), type: b.type, amount, cat: String(b.cat), sub: String(b.sub || ''), date: b.date, desc: String(b.desc || '').slice(0, 120), method: String(b.method || 'Cash') };
};

export const api = (url, method = 'GET', body) =>
  supabase
    ? Promise.resolve().then(() => cloud(url, method, body))
    : STATIC
    ? Promise.resolve().then(() => local(url, method, body))
    : fetch(API_BASE + url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: 'Bearer ' + getToken() } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
