import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StickerPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  priceUSD: number;
  contentLevel: string;
  isActive: boolean;
}

interface Wallet {
  balanceUSD: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface Transaction {
  id: string;
  totalUSD: number;
  dancerEarning: number;
  quantity: number;
  createdAt: string;
  sender: { username: string };
  stickerPack: { name: string; emoji: string };
}

interface Session {
  id: string;
  title: string;
  endedAt: string | null;
  totalEarned: number;
  startedAt: string;
}

const CONTENT_LEVELS = ['BASIC', 'PREMIUM', 'EXCLUSIVE'] as const;

export default function DancerDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<'stickers' | 'earnings' | 'withdraw' | 'live'>('live');
  const [showNewPack, setShowNewPack] = useState(false);
  const [newPack, setNewPack] = useState({ name: '', emoji: '💃', description: '', priceUSD: 5, contentLevel: 'BASIC' as const });
  const [sessionTitle, setSessionTitle] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amountUSD: 10, method: 'TAKENOS' as const, destination: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.dancer) { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const [packsRes, earningsRes] = await Promise.all([
      api.get('/stickers/my'),
      api.get('/dancers/profile/earnings'),
    ]);
    setPacks(packsRes.data);
    setWallet(earningsRes.data.wallet);
    setTransactions(earningsRes.data.recentTransactions);

    const sessionsRes = await api.get('/sessions/live');
    const mySession = sessionsRes.data.find((s: any) => s.dancer?.userId === user?.id || user?.dancer?.id === s.dancerId);
    setActiveSession(mySession || null);
  };

  const createPack = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      const res = await api.post('/stickers', newPack);
      setPacks(p => [...p, res.data]);
      setShowNewPack(false);
      setNewPack({ name: '', emoji: '💃', description: '', priceUSD: 5, contentLevel: 'BASIC' });
      setMsg('✅ Sticker creado');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear sticker');
    }
  };

  const deletePack = async (id: string) => {
    await api.delete(`/stickers/${id}`);
    setPacks(p => p.filter(pack => pack.id !== id));
  };

  const startSession = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/sessions/start', { title: sessionTitle });
      setActiveSession(res.data);
      setMsg('🔴 ¡Sesión iniciada!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    await api.post(`/sessions/${activeSession.id}/end`);
    setActiveSession(null);
    setMsg('Sesión finalizada');
    await refreshUser();
  };

  const requestWithdrawal = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/wallet/withdraw', withdrawForm);
      setMsg(`✅ Retiro de $${withdrawForm.amountUSD} solicitado via ${withdrawForm.method}`);
      await loadData();
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al solicitar retiro');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'live', label: '🔴 En Vivo' },
    { key: 'stickers', label: '💫 Mis Stickers' },
    { key: 'earnings', label: '💰 Ganancias' },
    { key: 'withdraw', label: '🏦 Retirar' },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-1">Mi Dashboard 💃</h1>
        <p className="text-gray-400 text-sm">Hola, {user?.dancer?.displayName || user?.username}</p>

        {wallet && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-brand-400">${wallet.balanceUSD.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Disponible</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-400">${wallet.totalEarned.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Total ganado</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-300">${wallet.totalWithdrawn.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Retirado</div>
            </div>
          </div>
        )}
      </div>

      {msg && <div className="bg-green-900/50 border border-green-700 text-green-300 rounded-lg p-3 text-sm">{msg}</div>}
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 text-sm">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg(''); setError(''); }}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: En Vivo */}
      {tab === 'live' && (
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">Gestionar sesión en vivo</h2>
          {activeSession ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="font-semibold">{activeSession.title}</span>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/live/${activeSession.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex-1 text-center text-sm"
                >
                  Ver sala 🔗
                </a>
                <button onClick={endSession} className="btn-secondary flex-1 text-sm text-red-400 hover:text-red-300">
                  Finalizar sesión
                </button>
              </div>
              <p className="text-xs text-gray-500">Comparte el link de la sala con tus seguidores.</p>
            </div>
          ) : (
            <form onSubmit={startSession} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Título del show</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Salsa caliente, viernes en vivo..."
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  minLength={3}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Iniciando...' : '🔴 Iniciar sesión en vivo'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab: Stickers */}
      {tab === 'stickers' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Mis stickers</h2>
            <button onClick={() => setShowNewPack(true)} className="btn-primary text-sm py-1.5">
              + Nuevo sticker
            </button>
          </div>

          {showNewPack && (
            <form onSubmit={createPack} className="bg-gray-800 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm">Nuevo sticker pack</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Emoji</label>
                  <input className="input" value={newPack.emoji} onChange={e => setNewPack(p => ({ ...p, emoji: e.target.value }))} maxLength={5} required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio USD</label>
                  <input type="number" className="input" min={0.5} max={500} step={0.5} value={newPack.priceUSD} onChange={e => setNewPack(p => ({ ...p, priceUSD: parseFloat(e.target.value) }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                <input className="input" placeholder="Ej: Baile básico" value={newPack.name} onChange={e => setNewPack(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Descripción</label>
                <input className="input" placeholder="¿Qué harás cuando recibas este sticker?" value={newPack.description} onChange={e => setNewPack(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nivel de contenido</label>
                <select className="input" value={newPack.contentLevel} onChange={e => setNewPack(p => ({ ...p, contentLevel: e.target.value as any }))}>
                  <option value="BASIC">Básico</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="EXCLUSIVE">Exclusivo</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewPack(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 text-sm">Crear sticker</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {packs.length === 0 && !showNewPack && (
              <p className="text-gray-500 text-sm text-center py-4">No tienes stickers. Crea uno para que los fans te puedan pagar.</p>
            )}
            {packs.map(pack => (
              <div key={pack.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                <span className="text-2xl">{pack.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{pack.name}</div>
                  <div className="text-xs text-gray-400">{pack.description}</div>
                </div>
                <div className="text-brand-400 font-bold">${pack.priceUSD.toFixed(2)}</div>
                <button onClick={() => deletePack(pack.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Ganancias */}
      {tab === 'earnings' && (
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">Historial de ganancias</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Aún no has recibido stickers.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{tx.stickerPack.emoji}</span>
                    <div>
                      <div className="text-sm font-medium">
                        {tx.quantity}x {tx.stickerPack.name} de <span className="text-brand-400">@{tx.sender.username}</span>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('es-EC')}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">+${tx.dancerEarning.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">de ${tx.totalUSD.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Retirar */}
      {tab === 'withdraw' && (
        <div className="card space-y-4">
          <h2 className="font-bold text-lg">Solicitar retiro</h2>
          <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-400">
            Saldo disponible: <span className="text-brand-400 font-bold">${wallet?.balanceUSD.toFixed(2) || '0.00'}</span>
            <br />
            Mínimo: $10 — Máximo: $500 — Procesado en 1-2 días hábiles.
          </div>
          <form onSubmit={requestWithdrawal} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monto a retirar (USD)</label>
              <input
                type="number"
                className="input"
                min={10}
                max={Math.min(500, wallet?.balanceUSD || 0)}
                step={0.01}
                value={withdrawForm.amountUSD}
                onChange={e => setWithdrawForm(f => ({ ...f, amountUSD: parseFloat(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Método de retiro</label>
              <select
                className="input"
                value={withdrawForm.method}
                onChange={e => setWithdrawForm(f => ({ ...f, method: e.target.value as any }))}
              >
                <option value="TAKENOS">📱 Takenos (Ecuador)</option>
                <option value="BANK_TRANSFER">🏦 Transferencia bancaria</option>
                <option value="PAYPHONE">📲 Payphone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {withdrawForm.method === 'TAKENOS' ? 'Número Takenos' :
                 withdrawForm.method === 'BANK_TRANSFER' ? 'Número de cuenta bancaria' :
                 'Número Payphone'}
              </label>
              <input
                type="text"
                className="input"
                placeholder={
                  withdrawForm.method === 'TAKENOS' ? 'Ej: 0998765432' :
                  withdrawForm.method === 'BANK_TRANSFER' ? 'Ej: 2200123456789' :
                  'Ej: 0991234567'
                }
                value={withdrawForm.destination}
                onChange={e => setWithdrawForm(f => ({ ...f, destination: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={loading || (wallet?.balanceUSD || 0) < 10} className="btn-primary w-full">
              {loading ? 'Procesando...' : `Solicitar retiro de $${withdrawForm.amountUSD}`}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
