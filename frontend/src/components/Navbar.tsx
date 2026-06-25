import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between h-16">
        <Link to="/" className="text-2xl font-bold text-brand-400 flex items-center gap-2">
          💃 DancePay
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role === 'DANCER' && (
                <Link to="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Mi Dashboard
                </Link>
              )}
              <Link to="/wallet" className="text-sm text-gray-300 hover:text-white transition-colors">
                💰 {user.wallet ? `$${user.wallet.balanceUSD.toFixed(2)}` : 'Billetera'}
              </Link>
              <span className="text-sm text-gray-500">@{user.username}</span>
              <button onClick={handleLogout} className="btn-secondary text-sm py-1.5">
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
                Ingresar
              </Link>
              <Link to="/register" className="btn-primary text-sm py-1.5">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
