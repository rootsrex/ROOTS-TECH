import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRole = (location.state as any)?.defaultRole || 'VIEWER';

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    role: defaultRole as 'VIEWER' | 'DANCER',
    displayName: '',
    whatsapp: '',
    takenos: '',
    cedula: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await loginWithToken(data.token);
      navigate(form.role === 'DANCER' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="max-w-md mx-auto mt-10 pb-10">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos comunes */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Correo electrónico</label>
            <input type="email" className="input" placeholder="tu@correo.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input type="text" className="input" placeholder="solo_letras_numeros"
              value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))}
              pattern="[a-zA-Z0-9_]+" minLength={3} maxLength={30} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={set('password')} minLength={6} required />
          </div>

          {/* Campos solo para bailarinas */}
          {form.role === 'DANCER' && (
            <>
              <hr className="border-gray-700 my-2" />
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wide">Datos para recibir pagos</p>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre artístico</label>
                <input type="text" className="input" placeholder="Tu nombre en la plataforma"
                  value={form.displayName} onChange={set('displayName')} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">📱 Número WhatsApp</label>
                <input type="tel" className="input" placeholder="0991234567"
                  value={form.whatsapp} onChange={set('whatsapp')} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">💳 ID de TakeNos</label>
                <input type="text" className="input" placeholder="Tu usuario en TakeNos"
                  value={form.takenos} onChange={set('takenos')} required />
                <p className="text-xs text-gray-500 mt-1">Aquí recibirás tus pagos</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">🪪 Cédula de identidad</label>
                <input type="text" className="input" placeholder="1234567890"
                  value={form.cedula} onChange={set('cedula')}
                  pattern="[0-9]{10}" maxLength={10} required />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-400 hover:underline">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}
