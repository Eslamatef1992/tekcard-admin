import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
      setToken(token);
      nav('/');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="login">
      <form className="panel login-box" onSubmit={submit}>
        <div className="brand big"><span className="logo">T</span>TekCard Admin</div>
        <p className="muted">Sign in to manage NFC smart cards</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <div className="alert">{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
