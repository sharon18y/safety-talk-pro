// Simpan di: frontend/src/App.jsx
import { Component, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import FormInput from './components/FormInput';
import Dashboard from './components/Dashboard';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';

// Ikon Dashboard
const IconDashboard = ({ active }) => (
  <svg className={`w-[22px] h-[22px] ${active ? 'pop' : ''}`} viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="10" rx="2.2" />
    <rect x="13" y="3" width="8" height="6" rx="2.2" />
    <rect x="13" y="11" width="8" height="10" rx="2.2" />
    <rect x="3" y="15" width="8" height="6" rx="2.2" />
  </svg>
);

// Ikon Input Laporan
const IconInput = ({ active }) => (
  <svg className={`w-[22px] h-[22px] ${active ? 'pop' : ''}`} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="4.5" width="14" height="17" rx="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
    <rect x="9" y="2.5" width="6" height="4" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 10.5v6M9 13.5h6" stroke={active ? '#fff' : 'currentColor'} strokeWidth="1.8" />
  </svg>
);

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Halaman gagal ditampilkan</h2>
          <pre className="mt-3 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs text-[#D70015] dark:text-[#FF453A] break-words">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 w-full py-3 rounded-2xl bg-[#007AFF] text-white font-semibold active:scale-[0.98] transition">Muat ulang</button>
        </div>
      </div>
    );
  }
}

// UBAH: Dasbor menjadi rute utama (/), dan Input menjadi (/input)
const tabs = [
  { to: '/', label: 'Dasbor', Icon: IconDashboard, end: true },
  { to: '/input', label: 'Input Laporan', Icon: IconInput, end: false },
];
const ORDER = { '/': 0, '/input': 1 };

function AnimatedRoutes({ isAuthenticated, setIsAuthenticated }) {
  const location = useLocation();
  const prev = useRef(location.pathname);
  const anim = useRef('page-in-right');

  if (prev.current !== location.pathname) {
    anim.current = (ORDER[location.pathname] ?? 0) >= (ORDER[prev.current] ?? 0) ? 'page-in-right' : 'page-in-left';
    prev.current = location.pathname;
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className={anim.current}>
      <ErrorBoundary>
        <Routes location={location}>
          
          {/* HALAMAN UTAMA: Dasbor Publik (Tanpa Login) */}
          <Route path="/" element={<Dashboard />} />

          {/* HALAMAN INPUT: Dilindungi oleh Autentikasi */}
          <Route 
            path="/input" 
            element={
              isAuthenticated ? (
                <FormInput />
              ) : (
                <Login onLoginSuccess={() => setIsAuthenticated(true)} />
              )
            } 
          />

        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  // Tab indeks berubah berdasarkan rute aktif
  const index = pathname.startsWith('/input') ? 1 : 0;

  const tabCls = ({ isActive }) =>
    `relative z-10 w-[104px] flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[10px] whitespace-nowrap transition duration-300 active:scale-95 ${
      isActive ? 'text-[#007AFF] font-semibold' : 'text-[#6C6C70] dark:text-[#98989D] font-medium hover:text-gray-900 dark:hover:text-white'
    }`;

  return (
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 z-40 flex justify-center pointer-events-none bottom-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto rounded-[26px] p-1.5 relative overflow-hidden bg-[#767680]/[0.16] dark:bg-white/[0.08] backdrop-blur-2xl border border-white/40 dark:border-white/15 ring-1 ring-black/[0.06] dark:ring-0 shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
        <div className="relative flex">
          <span className="absolute inset-y-0 left-0 rounded-[20px] bg-white/55 dark:bg-white/20 shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ width: `${100 / tabs.length}%`, transform: `translateX(${index * 100}%)` }} />
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={tabCls}>
              {({ isActive }) => (<><Icon active={isActive} /><span>{label}</span></>)}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('safety_token'));

  const handleLogout = () => {
    localStorage.removeItem('safety_token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <header className="sticky top-0 z-30 bg-[#F2F2F7]/50 dark:bg-black/40 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/10 pt-[env(safe-area-inset-top)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
              <span className="w-8 h-8 rounded-[10px] bg-gradient-to-b from-[#FF9F0A] to-[#FF6B00] text-white grid place-items-center shadow-sm">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </span>
              <span className="text-[17px] font-bold tracking-tight text-gray-900 dark:text-white">SafetyTalk</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              {/* Tombol Logout hanya akan muncul jika user sedang login */}
              {isAuthenticated && (
                <button onClick={handleLogout} className="text-[13px] font-semibold text-[#FF3B30] dark:text-[#FF453A] bg-[#FF3B30]/10 px-3 py-1.5 rounded-full active:scale-95 transition">
                  Keluar
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="py-5 sm:py-8 pb-28">
          {/* Oper state login ke komponen rute */}
          <AnimatedRoutes isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        </main>
        
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;