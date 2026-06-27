import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface Dancer {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isLive: boolean;
  isVerified: boolean;
  contentLevel: string;
  user: { username: string };
  _count: { sessions: number; receivedStickers: number };
  stickerPacks: Array<{ priceUSD: number }>;
}

interface LiveSession {
  id: string;
  title: string;
  viewerCount: number;
  totalEarned: number;
  dancer: { displayName: string; avatarUrl: string; contentLevel: string };
}

const contentLevelBadge: Record<string, string> = {
  BASIC: 'bg-green-900 text-green-300',
  PREMIUM: 'bg-purple-900 text-purple-300',
  EXCLUSIVE: 'bg-red-900 text-red-300',
};

const contentLevelLabel: Record<string, string> = {
  BASIC: 'Básico',
  PREMIUM: 'Premium',
  EXCLUSIVE: 'Exclusivo',
};

export default function Explore() {
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dancers'),
      api.get('/sessions/live'),
    ]).then(([d, s]) => {
      setDancers(d.data);
      setLiveSessions(s.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-brand-400 text-lg animate-pulse">Cargando bailarinas...</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="text-brand-400">Cobra</span> mientras bailas 💃
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Envía stickers a tus bailarinas favoritas. Cada sticker vale dinero real que ellas pueden retirar en Ecuador via Takenos.
        </p>
        <Link to="/register" className="btn-primary inline-block mt-5 text-lg px-8 py-3">
          Empieza gratis
        </Link>
      </div>

      {/* En vivo ahora */}
      {liveSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse inline-block"></span>
            En vivo ahora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveSessions.map((session) => (
              <Link key={session.id} to={`/live/${session.id}`} className="card hover:border-brand-500 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-900 flex items-center justify-center text-2xl flex-shrink-0">
                    {session.dancer.avatarUrl ? (
                      <img src={session.dancer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : '💃'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate group-hover:text-brand-400 transition-colors">
                      {session.dancer.displayName}
                    </div>
                    <div className="text-sm text-gray-400 truncate">{session.title}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span>👁 {session.viewerCount}</span>
                      <span>💰 ${session.totalEarned.toFixed(2)}</span>
                      <span className={`px-1.5 py-0.5 rounded ${contentLevelBadge[session.dancer.contentLevel]}`}>
                        {contentLevelLabel[session.dancer.contentLevel]}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Todas las bailarinas */}
      <section>
        <h2 className="text-xl font-bold mb-4">Bailarinas</h2>
        {dancers.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            No hay bailarinas registradas aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dancers.map((dancer) => {
              const minPrice = dancer.stickerPacks.length > 0
                ? Math.min(...dancer.stickerPacks.map(p => p.priceUSD))
                : null;
              return (
                <Link key={dancer.id} to={`/dancer/${dancer.id}`} className="card hover:border-brand-500 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-2xl">
                        {dancer.avatarUrl ? (
                          <img src={dancer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : '💃'}
                      </div>
                      {dancer.isLive && (
                        <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
                          {dancer.displayName}
                        </span>
                        {dancer.isVerified && <span title="Verificada">✅</span>}
                      </div>
                      <div className="text-sm text-gray-400 truncate">@{dancer.user.username}</div>
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">{dancer.bio}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {minPrice !== null && <span>💎 Desde ${minPrice.toFixed(2)}</span>}
                        <span>🎭 {dancer._count.sessions} shows</span>
                        <span className={`px-1.5 py-0.5 rounded ${contentLevelBadge[dancer.contentLevel]}`}>
                          {contentLevelLabel[dancer.contentLevel]}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Cómo funciona */}
      <section className="card">
        <h2 className="text-xl font-bold mb-6 text-center">¿Cómo funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '💳', title: 'Recarga créditos', desc: 'Agrega saldo a tu billetera para enviar stickers' },
            { icon: '🎭', title: 'Envía stickers', desc: 'Elige el sticker y envíalo durante el show en vivo' },
            { icon: '💃', title: 'Bailarinas cobran', desc: 'Ellas retiran sus ganancias via Takenos o banco en Ecuador' },
          ].map((step) => (
            <div key={step.title} className="text-center">
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 p-3 bg-gray-800 rounded-lg text-center text-sm text-gray-400">
          DancePay cobra una comisión del 20% por cada transacción. El 80% va directamente a la bailarina.
        </div>
      </section>
    </div>
  );
}
