import { useState } from 'react';
import { api } from '../api';

export default function Settings() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      await api('/auth/password', { method: 'POST', body: { current, next } });
      setMsg({ ok: true, text: 'Password updated' }); setCurrent(''); setNext('');
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  }

  return (
    <>
      <h1>Settings</h1>
      <form className="panel narrow" onSubmit={submit}>
        <h3>Change password</h3>
        <label>Current password<input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required /></label>
        <label>New password<input type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required /></label>
        {msg && <div className={msg.ok ? 'alert ok' : 'alert'}>{msg.text}</div>}
        <button className="btn primary">Update password</button>
      </form>
    </>
  );
}
