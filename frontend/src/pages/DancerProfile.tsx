import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StickerPanel from '../components/StickerPanel';

interface StickerPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  priceUSD: number;
  contentLevel: string;
}

interface Dancer {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isLive: boolean;
  isVerified: boolean;
  contentLevel: string;
  user: { username: string };
  stickerPacks: StickerPack[];
  sessions: Array<{ id: string; title: string; totalEarned: number; startedAt: string }>;
}

export default function DancerProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [dancer, setDancer] = useState<Dancer | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get(`/dancers/${id}`).then(r => setDancer(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;
  if (!dancer) return <div className="text-center py-20 text-red-400">Bailarina no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="card flex items-start gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-4xl flex-shrink-0">
          {dancer.avatarUrl ? (
            <img src={dancer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : '💃'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{dancer.displayName}</h1>
            {dancer.isVerified && <span title="Verificada" className="text-green-400">✅</span>}
            {dancer.isLive && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <div className="text-gray-400 text-sm">@{dancer.user.username}</div>
          <p className="text-gray-300 mt-2">{dancer.bio || 'Sin descripción aún.'}</p>
          {dancer.isLive && (
            <Link to={`/live/${dancer.sessions[0]?.id}`} className="btn-primary inline-block mt-3 text-sm">
              🔴 Ver en vivo
            </Link>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 rounded-lg p-3 text-sm">
          {successMsg}
        </div>
      )}

      {/* Sticker packs */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Enviar stickers</h2>
        {dancer.stickerPacks.length === 0 ? (
          <p className="text-gray-500 text-sm">Esta bailarina aún no configuró sus stickers.</p>
        ) : (
          <StickerPanel
            packs={dancer.stickerPacks}
            dancerId={dancer.id}
            sessionId={undefined}
            onSuccess={(msg) => setSuccessMsg(msg)}
            disabled={!user}
          />
        )}
        {!user && (
          <p className="text-sm text-gray-500 mt-3">
            <Link to="/login" className="text-brand-400 hover:underline">Inicia sesión</Link> para enviar stickers.
          </p>
        )}
      </div>

      {/* Shows anteriores */}
      {dancer.sessions.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Shows recientes</h2>
          <div className="space-y-2">
            {dancer.sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-gray-500">{new Date(s.startedAt).toLocaleDateString('es-EC')}</div>
                </div>
                <div className="text-sm text-brand-400 font-semibold">${s.totalEarned.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
