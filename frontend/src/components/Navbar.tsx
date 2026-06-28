import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    location.pathname === path ? 'text-white' : 'text-gray-400 hover:text-white';

  return (
    <nav className="bg-gray-900/95 backdrop-blur border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-black text-brand-400 flex items-center gap-1.5">
            💃 DancePay
          </Link>
          <Link to="/explore" className={`text-sm transition-colors ${isActive('/explore')}`}>
            Explorar
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'DANCER' && (
                <Link to="/dashboard" className={`text-sm transition-colors ${isActive('/dashboard')}`}>
                  Mi Dashboard
                </Link>
              )}
              {user.role !== 'DANCER' && (
                <Link to="/coins" className={`text-sm transition-colors ${isActive('/coins')}`}>
                  🪙 {(user as any).wallet?.coinBalance ?? 0}
                </Link>
              )}
              {user.role === 'DANCER' && (
                <Link to="/wallet" className={`text-sm transition-colors ${isActive('/wallet')}`}>
                  💰 {user.wallet ? `$${user.wallet.balanceUSD.toFixed(2)}` : 'Billetera'}
                </Link>
              )}
              <span className="text-sm text-gray-600 hidden sm:inline">@{user.username}</span>
              <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Ingresar
              </Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-4">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
