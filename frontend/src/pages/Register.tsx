import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = (location.state as any)?.defaultRole || 'VIEWER';

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    role: defaultRole as 'VIEWER' | 'DANCER',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate(form.role === 'DANCER' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_URL}/api/auth/google?role=${form.role}`;
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6 text-center">💃 Crear cuenta</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Selector de rol */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(['VIEWER', 'DANCER'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm(f => ({ ...f, role }))}
              className={`p-4 rounded-lg border-2 transition-colors text-center ${
                form.role === role
                  ? 'border-brand-500 bg-brand-900/30 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">{role === 'VIEWER' ? '👁' : '💃'}</div>
              <div className="font-semibold text-sm">{role === 'VIEWER' ? 'Espectador' : 'Bailarina'}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {role === 'VIEWER' ? 'Envía stickers' : 'Cobra bailando'}
              </div>
            </button>
          ))}
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleRegister}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors mb-4"
        >
          <GoogleIcon />
          Registrarse con Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500">o con email y contraseña</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.role === 'DANCER' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre artístico</label>
              <input
                type="text"
                className="input"
                placeholder="Tu nombre en la plataforma"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              className="input"
              placeholder="solo_letras_numeros"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              pattern="[a-zA-Z0-9_]+"
              minLength={3}
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              minLength={6}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {form.role === 'DANCER' && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
            💡 Como bailarina puedes configurar tus propios stickers con el precio que quieras y retirar tus ganancias via Takenos.
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}
