import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface StickerPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  priceUSD: number;
  contentLevel: string;
}

interface Props {
  packs: StickerPack[];
  dancerId: string;
  sessionId?: string;
  onSuccess?: (msg: string) => void;
  onStickerSent?: (pack: StickerPack) => void;
  disabled?: boolean;
}

const contentColors: Record<string, string> = {
  BASIC: 'border-green-700',
  PREMIUM: 'border-purple-700',
  EXCLUSIVE: 'border-yellow-600',
};

export default function StickerPanel({ packs, dancerId, sessionId, onSuccess, onStickerSent, disabled }: Props) {
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState<StickerPack | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/transactions/send', {
        dancerId,
        stickerPackId: selected.id,
        quantity,
        sessionId,
        message: message.trim() || undefined,
      });
      const total = (selected.priceUSD * quantity).toFixed(2);
      onSuccess?.(`✅ Enviaste ${quantity}x ${selected.emoji} ${selected.name} por $${total}`);
      onStickerSent?.(selected);
      setSelected(null);
      setQuantity(1);
      setMessage('');
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar sticker');
    } finally {
      setLoading(false);
    }
  };

  const total = selected ? (selected.priceUSD * quantity).toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {packs.map((pack) => (
          <button
            key={pack.id}
            onClick={() => { if (!disabled) setSelected(pack); }}
            disabled={!!disabled}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selected?.id === pack.id
                ? `${contentColors[pack.contentLevel] || 'border-brand-500'} bg-gray-800`
                : 'border-gray-700 hover:border-gray-600 bg-gray-850'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-2xl mb-1">{pack.emoji}</div>
            <div className="text-sm font-semibold text-white">{pack.name}</div>
            <div className="text-xs text-gray-400">{pack.description}</div>
            <div className="text-brand-400 font-bold mt-1">${pack.priceUSD.toFixed(2)}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selected.emoji}</span>
            <span className="font-semibold">{selected.name}</span>
            <span className="text-brand-400">${selected.priceUSD.toFixed(2)} c/u</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Cantidad:</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
              >−</button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(100, q + 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center font-bold"
              >+</button>
            </div>
            <span className="text-brand-400 font-bold ml-auto">Total: ${total}</span>
          </div>

          <input
            type="text"
            className="input text-sm"
            placeholder="Mensaje opcional (ej: pon Pachanga)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={100}
          />

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2">
            <button onClick={() => setSelected(null)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleSend} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Enviando...' : `Enviar $${total} 💫`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
