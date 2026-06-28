import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    loginWithToken(token).then(() => {
      navigate('/', { replace: true });
    }).catch(() => {
      navigate('/login?error=google_failed', { replace: true });
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Iniciando sesión con Google...</p>
    </div>
  );
}
