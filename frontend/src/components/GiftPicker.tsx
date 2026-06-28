import { useState, useEffect } from 'react';
import api from '../services/api';

interface Gift {
  id: string;
  name: string;
  emoji: string;
  coinCost: number;
  category: string;
  animation: string;
}

interface Props {
  dancerId: string;
  sessionId?: string;
  coinBalance: number;
  onSent?: (newBalance: number) => void;
  onClose: () => void;
}

const CATEGORIES = ['BASIC', 'PREMIUM', 'EXCLUSIVE'] as const;
const CAT_LABEL: Record<string, string> = { BASIC: 'Básico', PREMIUM: 'Premium', EXCLUSIVE: 'Exclusivo' };

export default function GiftPicker({ dancerId, sessionId, coinBalance, onSent, onClose }: Props) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [cat, setCat] = useState<string>('BASIC');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<string | null>(null);

  useEffect(() => {
    api.get('/gifts').then(r => setGifts(r.data));
  }, []);

  const filtered = gifts.filter(g => g.category === cat);

  const sendGift = async (gift: Gift) => {
    if (coinBalance < gift.coinCost) {
      setError(`Necesitas ${gift.coinCost} monedas. Ve a la tienda para recargar.`);
      return;
    }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/gifts/send', {
        giftId: gift.id, dancerId, sessionId, quantity: 1, message,
      });
      setSent(gift.emoji);
      onSent?.(data.newCoinBalance);
      setTimeout(() => setSent(null), 2000);
      setMessage('');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al enviar regalo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-lg p-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">Enviar Regalo</h3>
          <div className="text-sm text-brand-300 font-medium">{coinBalance} 🪙</div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2 mb-3">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                cat === c ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>

        {/* Regalos */}
        <div className="grid grid-cols-4 gap-2 mb-3 max-h-48 overflow-y-auto">
          {filtered.map(g => (
            <button
              key={g.id}
              onClick={() => sendGift(g)}
              disabled={loading || coinBalance < g.coinCost}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                coinBalance < g.coinCost
                  ? 'border-gray-800 opacity-40 cursor-not-allowed'
                  : 'border-gray-700 hover:border-brand-500 hover:bg-brand-900/20'
              }`}
            >
              <span className="text-3xl">{g.emoji}</span>
              <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">{g.name}</span>
              <span className="text-xs text-brand-300 font-medium">{g.coinCost}🪙</span>
            </button>
          ))}
        </div>

        {/* Mensaje */}
        <input
          className="input text-sm mb-2"
          placeholder="Mensaje (opcional)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={100}
        />

        {error && <div className="text-xs text-red-400 mb-2">{error}</div>}

        {/* Animación de envío */}
        {sent && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="text-8xl animate-bounce">{sent}</div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm">
            Cancelar
          </button>
          <a href="/coins" className="flex-1 py-2 rounded-lg bg-brand-900/50 border border-brand-700 text-brand-300 hover:bg-brand-900 text-sm text-center">
            + Recargar monedas
          </a>
        </div>
      </div>
    </div>
  );
}
