import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { getToken, setToken } from './api';
import Login from './pages/Login.jsx';
import Cards from './pages/Cards.jsx';
import CardEditor from './pages/CardEditor.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function Layout({ children }) {
  const nav = useNavigate();
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="logo">T</span>TekCard</div>
        <nav>
          <NavLink to="/" end>Cards</NavLink>
          <NavLink to="/cards/new">+ New card</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button className="btn ghost logout" onClick={() => { setToken(null); nav('/login'); }}>Log out</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout><Cards /></Layout></Protected>} />
      <Route path="/cards/new" element={<Protected><Layout><CardEditor /></Layout></Protected>} />
      <Route path="/cards/:id" element={<Protected><Layout><CardEditor /></Layout></Protected>} />
      <Route path="/settings" element={<Protected><Layout><Settings /></Layout></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
