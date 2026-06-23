import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tropels', label: 'Tropeles' },
  { to: '/signals', label: 'Señales' },
  { to: '/sectors', label: 'Sectores' },
];

export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Tuckersoft</p>
            <h1 className="font-bold">TropelCare Control Room</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-right text-xs text-slate-300">
            <span className="hidden sm:block">
              {user?.displayName}
              <br />
              <strong className="text-cyan-200">{user?.teamCode}</strong>
            </span>
            <button onClick={onLogout} className="rounded-full border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
