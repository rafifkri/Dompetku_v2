import { useState } from 'react';
import logo from '../assets/logo.png';
import { api, setToken } from '../api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login');

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || (mode === 'register' && !name.trim())) return setError('Lengkapi semua data yang diperlukan.');
    try {
      const data = await api('/api/auth/' + mode, 'POST', { name, email, password });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(mode === 'register' ? 'Email sudah terdaftar atau data tidak valid.' : 'Email atau password salah.');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <img src={logo} alt="Dompetku" />
        <div className="auth-quote">
          <span className="auth-kicker">FINANCE, BUT MAKE IT SIMPLE</span>
          <h1>Rapi mengatur uang,<br />tenang menjalani hari.</h1>
          <p>Catat, pahami, dan bangun kebiasaan finansial yang lebih baik bersama Dompetku.</p>
        </div>
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-mobile-logo"><img src={logo} alt="Dompetku" /></div>
          <span className="auth-kicker">{mode === 'login' ? 'SELAMAT DATANG KEMBALI' : 'MULAI PERJALANANMU'}</span>
          <h2>{mode === 'login' ? 'Masuk ke akunmu' : 'Buat akun Dompetku'}</h2>
          <p className="sub">{mode === 'login' ? 'Lanjutkan mengatur keuangan dengan lebih terarah.' : 'Data keuanganmu akan aman dan tersinkron di semua perangkat.'}</p>
          {mode === 'register' && <label>Nama lengkap<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Rafif Fikri" /></label>}
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" /></label>
          <label>Password<input type="password" minLength="8" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn auth-submit" type="submit">{mode === 'login' ? 'Masuk ke Dompetku' : 'Daftar & mulai mencatat'}</button>
          <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Belum punya akun? Buat akun' : 'Sudah punya akun? Masuk'}</button>
          <p className="auth-note">Akun dan data tersimpan aman di server aplikasi.</p>
        </form>
      </section>
    </main>
  );
}
