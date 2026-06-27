import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div className="grid grid-cols-2 gap-3 mb-6">
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
