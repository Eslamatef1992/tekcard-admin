import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../api';
import Icon from '../components/Icon.jsx';

const EMPTY = {
  full_name: '', title: '', company: '', phone: '', email: '', bio: '',
  slug: '', theme_color: '#0f172a', is_active: true, links: [],
};

const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

let tmpId = 0;

export default function CardEditor() {
  const { id } = useParams();
  const isNew = !id;
  const nav = useNavigate();
  const location = useLocation();
  const [card, setCard] = useState(EMPTY);
  const [saved, setSaved] = useState(null); // last saved card from server
  const [platforms, setPlatforms] = useState([]);
  const [baseDomain, setBaseDomain] = useState('teknulugycard.com');
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState(null);
  const [pending, setPending] = useState({ banner: null, avatar: null }); // files chosen before first save
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const pMap = useMemo(() => Object.fromEntries(platforms.map((p) => [p.key, p])), [platforms]);

  useEffect(() => {
    api('/platforms').then((d) => { setPlatforms(d.platforms); setBaseDomain(d.base_domain); });
  }, []);

  useEffect(() => {
    setMsg(null);
    if (isNew) { setCard(EMPTY); setSaved(null); setSlugTouched(false); setPending({ banner: null, avatar: null }); return; }
    api(`/cards/${id}`).then(({ card: c }) => {
      setCard({ ...c, links: c.links.map((l) => ({ ...l, _k: ++tmpId })) });
      setSaved(c); setSlugTouched(true);
      if (location.state?.created) setMsg({ ok: true, text: 'Card created — copy the link below and write it to the NFC card.' });
    }).catch((e) => setMsg({ ok: false, text: e.message }));
  }, [id, isNew]);

  // Auto-generate link name from the person's name (until the admin edits it manually)
  useEffect(() => {
    if (!slugTouched) setCard((c) => ({ ...c, slug: slugify(c.full_name) }));
  }, [card.full_name, slugTouched]);

  // Live availability check
  useEffect(() => {
    if (!card.slug) { setSlugState(null); return; }
    const t = setTimeout(() => {
      api(`/slug-check?slug=${encodeURIComponent(card.slug)}&exclude=${id || 0}`).then(setSlugState).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [card.slug, id]);

  const set = (k) => (e) => setCard((c) => ({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const setLink = (i, k, v) => setCard((c) => ({ ...c, links: c.links.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const addLink = (platform) => setCard((c) => ({ ...c, links: [...c.links, { _k: ++tmpId, platform, value: '', label: '' }] }));
  const removeLink = (i) => setCard((c) => ({ ...c, links: c.links.filter((_, j) => j !== i) }));
  const moveLink = (i, d) => setCard((c) => {
    const links = [...c.links]; const j = i + d;
    if (j < 0 || j >= links.length) return c;
    [links[i], links[j]] = [links[j], links[i]];
    return { ...c, links };
  });

  async function uploadImage(kind, file, cardId = id) {
    if (!file) return;
    if (!cardId) { setPending((p) => ({ ...p, [kind]: file })); return; }
    setBusy(true);
    try {
      const { card: c } = await api(`/cards/${cardId}/${kind}`, { method: 'POST', file });
      setCard((cur) => ({ ...cur, [`${kind}_url`]: c[`${kind}_url`] }));
      setSaved(c);
    } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  }

  async function removeImage(kind) {
    if (!id) { setPending((p) => ({ ...p, [kind]: null })); return; }
    const { card: c } = await api(`/cards/${id}/${kind}`, { method: 'DELETE' });
    setCard((cur) => ({ ...cur, [`${kind}_url`]: '' })); setSaved(c);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const body = { ...card, links: card.links.map(({ id: lid, platform, value, label }) => ({ id: lid, platform, value, label })) };
      const { card: c } = isNew
        ? await api('/cards', { method: 'POST', body })
        : await api(`/cards/${id}`, { method: 'PUT', body });
      if (isNew) {
        for (const kind of ['banner', 'avatar']) if (pending[kind]) await api(`/cards/${c.id}/${kind}`, { method: 'POST', file: pending[kind] });
        setPending({ banner: null, avatar: null });
        nav(`/cards/${c.id}`, { replace: true, state: { created: true } });
        return;
      }
      setSaved(c);
      setCard({ ...c, links: c.links.map((l) => ({ ...l, _k: ++tmpId })) });
      setMsg({ ok: true, text: 'Saved. The card is live.' });
    } catch (err) { setMsg({ ok: false, text: err.message }); } finally { setBusy(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(saved.public_url);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png'); a.download = `${saved.slug}-qr.png`; a.click();
  }

  const bannerPreview = pending.banner ? URL.createObjectURL(pending.banner) : card.banner_url;
  const avatarPreview = pending.avatar ? URL.createObjectURL(pending.avatar) : card.avatar_url;
  const previewUrl = `https://${card.slug || 'your-name'}.${baseDomain}`;

  return (
    <>
      <div className="page-head">
        <h1>{isNew ? 'New card' : card.full_name || 'Edit card'}</h1>
        {!isNew && saved && <a className="btn" href={saved.public_url} target="_blank" rel="noreferrer">Open card ↗</a>}
      </div>

      {saved && (
        <div className="panel nfc">
          <div className="nfc-text">
            <span className="label">Link to write on the NFC card</span>
            <div className="nfc-url">{saved.public_url}</div>
            <div className="row">
              <button type="button" className="btn primary" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
              <button type="button" className="btn" onClick={downloadQr}>Download QR</button>
            </div>
            <p className="muted small">Write it as a <b>URL / URI record</b> using an NFC writer app (e.g. NFC Tools). Use the same link for the QR on the printed card.</p>
          </div>
          <div ref={qrRef} className="qr"><QRCodeCanvas value={saved.public_url} size={132} marginSize={2} /></div>
        </div>
      )}

      <form className="editor" onSubmit={save}>
        <div className="col">
          <section className="panel">
            <h3>Profile</h3>
            <label>Full name *<input value={card.full_name} onChange={set('full_name')} required placeholder="Eslam Atef" /></label>
            <div className="grid2">
              <label>Job title<input value={card.title} onChange={set('title')} placeholder="Technical Lead" /></label>
              <label>Company<input value={card.company} onChange={set('company')} placeholder="Teknulugy" /></label>
            </div>
            <div className="grid2">
              <label>Phone number<input className="ltr" value={card.phone} onChange={set('phone')} placeholder="9xxxxxxx or +965…" />
                <small className="muted">When scanned, visitors get: Save contact · Call · WhatsApp</small></label>
              <label>Email<input type="email" className="ltr" value={card.email} onChange={set('email')} placeholder="name@company.com" /></label>
            </div>
            <label>Bio<textarea rows={3} value={card.bio} onChange={set('bio')} maxLength={500} placeholder="Short description (optional)" /></label>
          </section>

          <section className="panel">
            <h3>Card link</h3>
            <label>Link name
              <div className="slug">
                <span className="pre">https://</span>
                <input className="ltr" value={card.slug} onChange={(e) => { setSlugTouched(true); setCard((c) => ({ ...c, slug: slugify(e.target.value) || e.target.value.toLowerCase() })); }} placeholder="eslam" />
                <span className="post">.{baseDomain}</span>
              </div>
            </label>
            {slugState && card.slug && (
              slugState.available
                ? <small className="ok-text">✓ {previewUrl} is available</small>
                : <small className="err-text">✗ {slugState.valid ? 'Already taken' : 'Not allowed'} — try <a href="#" onClick={(e) => { e.preventDefault(); setSlugTouched(true); setCard((c) => ({ ...c, slug: slugState.suggestion })); }}>{slugState.suggestion}</a></small>
            )}
            {!isNew && saved && card.slug !== saved.slug && <div className="alert warn">Changing the link name breaks NFC cards already written with {saved.public_url}.</div>}
            <div className="grid2 mt">
              <label>Theme color
                <div className="color"><input type="color" value={card.theme_color} onChange={set('theme_color')} /><span className="ltr">{card.theme_color}</span></div>
              </label>
              <label className="switch"><input type="checkbox" checked={card.is_active} onChange={set('is_active')} /><span>Card is active</span></label>
            </div>
          </section>

          <section className="panel">
            <h3>Banner &amp; photo</h3>
            <div className="images">
              <div className="img-slot banner-slot" style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : { background: card.theme_color }}>
                <span className="hint">Banner · 1200×600</span>
                <div className="img-actions">
                  <label className="btn tiny">Upload<input type="file" accept="image/*" hidden onChange={(e) => uploadImage('banner', e.target.files[0])} /></label>
                  {bannerPreview && <button type="button" className="btn tiny danger" onClick={() => removeImage('banner')}>Remove</button>}
                </div>
              </div>
              <div className="img-slot avatar-slot" style={avatarPreview ? { backgroundImage: `url(${avatarPreview})` } : { background: '#e2e8f0' }}>
                <span className="hint">Photo / logo</span>
                <div className="img-actions">
                  <label className="btn tiny">Upload<input type="file" accept="image/*" hidden onChange={(e) => uploadImage('avatar', e.target.files[0])} /></label>
                  {avatarPreview && <button type="button" className="btn tiny danger" onClick={() => removeImage('avatar')}>Remove</button>}
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <h3>Social media &amp; buttons</h3>
            {card.links.length === 0 && <p className="muted">No buttons yet — add from the list below.</p>}
            <div className="links-edit">
              {card.links.map((l, i) => (
                <div className="link-row" key={l._k}>
                  <div className="link-ic"><Icon icon={pMap[l.platform]?.icon} size={22} /></div>
                  <select value={l.platform} onChange={(e) => setLink(i, 'platform', e.target.value)}>
                    {platforms.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                  </select>
                  <input className="ltr grow" value={l.value} onChange={(e) => setLink(i, 'value', e.target.value)} placeholder={pMap[l.platform]?.placeholder} required />
                  <input className="label-in" value={l.label || ''} onChange={(e) => setLink(i, 'label', e.target.value)} placeholder="Button text (optional)" />
                  <div className="row-btns">
                    <button type="button" className="btn tiny" onClick={() => moveLink(i, -1)} title="Move up">↑</button>
                    <button type="button" className="btn tiny" onClick={() => moveLink(i, 1)} title="Move down">↓</button>
                    <button type="button" className="btn tiny danger" onClick={() => removeLink(i)} title="Remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-grid">
              {platforms.map((p) => (
                <button type="button" key={p.key} className="add-chip" onClick={() => addLink(p.key)}>
                  <Icon icon={p.icon} size={16} /> {p.label}
                </button>
              ))}
            </div>
          </section>

          {msg && <div className={msg.ok ? 'alert ok' : 'alert'}>{msg.text}</div>}
          <div className="save-bar">
            <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create card & generate link' : 'Save changes'}</button>
          </div>
        </div>

        {/* Live phone preview */}
        <div className="preview-col">
          <div className="phone">
            <div className="pv-banner" style={bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : { background: `linear-gradient(135deg, ${card.theme_color}, #334155)` }} />
            <div className="pv-head">
              {avatarPreview ? <img className="pv-avatar" src={avatarPreview} alt="" /> : <div className="pv-avatar" style={{ background: card.theme_color }}>{(card.full_name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>}
              <div className="pv-name">{card.full_name || 'Full name'}</div>
              <div className="pv-sub">{[card.title, card.company].filter(Boolean).join(' · ')}</div>
            </div>
            {card.phone && <div className="pv-quick"><span>Call</span><span>WhatsApp</span><span>Save</span></div>}
            <div className="pv-links">
              {card.links.filter((l) => l.value).map((l) => (
                <div className="pv-link" key={l._k}><Icon icon={pMap[l.platform]?.icon} size={18} /><span>{l.label || pMap[l.platform]?.label}</span></div>
              ))}
            </div>
            <div className="pv-save" style={{ background: card.theme_color }}>Save Contact</div>
          </div>
          <p className="muted small center ltr">{previewUrl}</p>
        </div>
      </form>
    </>
  );
}
