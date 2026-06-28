import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OAuthSetup() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const setupToken = searchParams.get('setup_token') || '';
  const redirected = useRef(false);

  const [form, setForm] = useState({
    username: '',
    role: 'VIEWER' as 'VIEWER' | 'DANCER',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!setupToken && !redirected.current) {
      redirected.current = true;
      navigate('/register', { replace: true });
    }
  }, [setupToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/oauth/setup', {
        setup_token: setupToken,
        username: form.username,
        role: form.role,
        displayName: form.displayName || form.username,
      });
      await loginWithToken(data.token);
      navigate(form.role === 'DANCER' ? '/dashboard' : '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold">¡Último paso!</h1>
          <p className="text-gray-400 text-sm mt-1">Elige tu tipo de cuenta y username para empezar.</p>
        </div>

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
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
          </button>
        </form>

        {form.role === 'DANCER' && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
            💡 Como bailarina puedes configurar stickers con el precio que quieras y retirar ganancias via Takenos.
          </div>
        )}
      </div>
    </div>
  );
}
