import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/cards?q=${encodeURIComponent(q)}`).then((d) => setCards(d.cards)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { api('/stats').then(setStats).catch(() => {}); }, []);

  function copy(url, id) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  async function remove(c) {
    if (!confirm(`Delete card "${c.full_name}"? The NFC link ${c.public_url} will stop working.`)) return;
    await api(`/cards/${c.id}`, { method: 'DELETE' });
    setCards((cs) => cs.filter((x) => x.id !== c.id));
  }

  return (
    <>
      <div className="page-head">
        <h1>Cards</h1>
        <Link className="btn primary" to="/cards/new">+ New card</Link>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat"><b>{stats.cards}</b><span>Cards</span></div>
          <div className="stat"><b>{stats.active || 0}</b><span>Active</span></div>
          <div className="stat"><b>{stats.views}</b><span>Card opens</span></div>
          <div className="stat"><b>{stats.clicks}</b><span>Link clicks</span></div>
        </div>
      )}

      <input className="search" placeholder="Search by name, link or phone…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="panel flush">
        {loading ? <p className="empty">Loading…</p> : cards.length === 0 ? (
          <p className="empty">No cards yet. <Link to="/cards/new">Create the first one</Link>.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>NFC link</th><th>Phone</th><th>Opens</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/cards/${c.id}`} className="who">
                      {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <span className="ph" style={{ background: c.theme_color }}>{c.full_name[0]}</span>}
                      <span><b>{c.full_name}</b><small>{[c.title, c.company].filter(Boolean).join(' · ')}</small></span>
                    </Link>
                  </td>
                  <td>
                    <div className="linkcell">
                      <a href={c.public_url} target="_blank" rel="noreferrer">{c.public_url.replace('https://', '')}</a>
                      <button className="btn tiny" onClick={() => copy(c.public_url, c.id)}>{copied === c.id ? 'Copied ✓' : 'Copy'}</button>
                    </div>
                  </td>
                  <td className="ltr">{c.phone}</td>
                  <td>{c.views}</td>
                  <td><span className={c.is_active ? 'pill on' : 'pill'}>{c.is_active ? 'Active' : 'Disabled'}</span></td>
                  <td className="actions">
                    <Link className="btn tiny" to={`/cards/${c.id}`}>Edit</Link>
                    <button className="btn tiny danger" onClick={() => remove(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
