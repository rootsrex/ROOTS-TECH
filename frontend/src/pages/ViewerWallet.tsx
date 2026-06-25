import { useEffect, useState, FormEvent } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Wallet {
  balanceUSD: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface Transaction {
  id: string;
  totalUSD: number;
  quantity: number;
  createdAt: string;
  dancer: { displayName: string };
  stickerPack: { name: string; emoji: string };
  message: string;
}

export default function ViewerWallet() {
  const { user, refreshUser } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState(10);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/wallet'),
      api.get('/transactions/history'),
    ]).then(([w, t]) => {
      setWallet(w.data);
      setTransactions(t.data);
    });
  }, []);

  const addCredits = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/wallet/add-credits', { amountUSD: amount });
      setWallet(w => w ? { ...w, balanceUSD: res.data.balance } : null);
      setMsg(`✅ Se agregaron $${amount} a tu billetera`);
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al recargar');
    } finally {
      setLoading(false);
    }
  };

  const PRESET_AMOUNTS = [5, 10, 20, 50];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Mi Billetera 💳</h1>
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-brand-400">${wallet?.balanceUSD.toFixed(2) || '0.00'}</div>
          <div className="text-gray-500 text-sm mt-1">USD disponibles</div>
        </div>
      </div>

      {msg && <div className="bg-green-900/50 border border-green-700 text-green-300 rounded-lg p-3 text-sm">{msg}</div>}
      {error && <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-3 text-sm">{error}</div>}

      {/* Recargar */}
      <div className="card space-y-4">
        <h2 className="font-bold text-lg">Recargar créditos</h2>
        <p className="text-sm text-gray-400">
          En producción aquí conectarías con una pasarela de pago (tarjeta, Payphone, etc.)
        </p>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map(a => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-2 rounded-lg border-2 font-semibold text-sm transition-colors ${
                amount === a ? 'border-brand-500 bg-brand-900/30 text-white' : 'border-gray-700 text-gray-400'
              }`}
            >
              ${a}
            </button>
          ))}
        </div>
        <form onSubmit={addCredits} className="flex gap-2">
          <input
            type="number"
            className="input"
            min={1}
            max={1000}
            step={1}
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value))}
            placeholder="Monto personalizado"
          />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? '...' : `Recargar $${amount}`}
          </button>
        </form>
        <p className="text-xs text-gray-600">
          ⚠️ En demo: la recarga es inmediata sin pago real. En producción integra con Payphone o tarjeta.
        </p>
      </div>

      {/* Historial de stickers enviados */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">Stickers enviados</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Aún no has enviado stickers.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tx.stickerPack.emoji}</span>
                  <div>
                    <div className="text-sm font-medium">
                      {tx.quantity}x {tx.stickerPack.name} a <span className="text-brand-400">{tx.dancer.displayName}</span>
                    </div>
                    {tx.message && <div className="text-xs text-gray-500">"{tx.message}"</div>}
                    <div className="text-xs text-gray-600">{new Date(tx.createdAt).toLocaleString('es-EC')}</div>
                  </div>
                </div>
                <div className="text-red-400 font-semibold">-${tx.totalUSD.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
