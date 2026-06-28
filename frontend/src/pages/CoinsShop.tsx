import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  bonus: number;
}

interface TopUp {
  id: string;
  coins: number;
  priceUSD: number;
  reference: string;
  status: string;
  createdAt: string;
  package?: { name: string };
}

export default function CoinsShop() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [myTopUps, setMyTopUps] = useState<TopUp[]>([]);
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/gifts/packages').then(r => setPackages(r.data));
    api.get('/gifts/my-topups').then(r => setMyTopUps(r.data));
  }, []);

  const handleRequest = async () => {
    if (!selected || !reference.trim()) {
      setError('Selecciona un paquete e ingresa tu referencia TakeNos');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/gifts/topup', { packageId: selected.id, reference: reference.trim() });
      setSuccess(`¡Solicitud enviada! Recibirás ${selected.coins + selected.bonus} monedas cuando el admin confirme tu pago de $${selected.priceUSD.toFixed(2)} por TakeNos.`);
      setSelected(null); setReference('');
      const r = await api.get('/gifts/my-topups');
      setMyTopUps(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'COMPLETED' ? 'text-green-400' : s === 'REJECTED' ? 'text-red-400' : 'text-yellow-400';

  const statusLabel = (s: string) =>
    s === 'COMPLETED' ? '✅ Aprobada' : s === 'REJECTED' ? '❌ Rechazada' : '⏳ Pendiente';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🪙 Tienda de Monedas</h1>
        <div className="bg-brand-900/40 border border-brand-700 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-gray-400">Tu saldo</div>
          <div className="text-xl font-bold text-brand-300">
            {(user as any)?.wallet?.coinBalance ?? '—'} 🪙
          </div>
        </div>
      </div>

      {/* Paquetes */}
      <div className="card">
        <h2 className="font-semibold mb-3 text-gray-300">Elige un paquete</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => setSelected(pkg)}
              className={`rounded-xl border-2 p-4 text-center transition-all ${
                selected?.id === pkg.id
                  ? 'border-brand-400 bg-brand-900/30'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl font-bold text-brand-300">{pkg.coins.toLocaleString()}</div>
              {pkg.bonus > 0 && (
                <div className="text-xs text-green-400 font-medium">+{pkg.bonus} bonus</div>
              )}
              <div className="text-sm text-gray-400 mt-1">{pkg.name}</div>
              <div className="text-lg font-bold mt-2">${pkg.priceUSD.toFixed(2)}</div>
              <div className="text-xs text-gray-500">USD vía TakeNos</div>
            </button>
          ))}
        </div>
      </div>

      {/* Instrucciones de pago */}
      {selected && (
        <div className="card border border-brand-700/50">
          <h2 className="font-semibold mb-3">Cómo pagar con TakeNos</h2>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>Envía <strong className="text-white">${selected.priceUSD.toFixed(2)} USD</strong> por TakeNos al ID del administrador</li>
            <li>Copia el <strong className="text-white">número de referencia</strong> de la transacción</li>
            <li>Pégalo abajo y confirma tu solicitud</li>
            <li>Recibirás <strong className="text-brand-300">{(selected.coins + selected.bonus).toLocaleString()} monedas</strong> en tu cuenta</li>
          </ol>

          {error && <div className="mt-3 text-sm text-red-400 bg-red-900/30 rounded-lg p-2">{error}</div>}
          {success && <div className="mt-3 text-sm text-green-400 bg-green-900/30 rounded-lg p-2">{success}</div>}

          <div className="mt-4 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Referencia TakeNos (ej: TK-123456)"
              value={reference}
              onChange={e => setReference(e.target.value)}
            />
            <button className="btn-primary whitespace-nowrap" onClick={handleRequest} disabled={loading}>
              {loading ? '...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      {myTopUps.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3 text-gray-300">Mis solicitudes</h2>
          <div className="space-y-2">
            {myTopUps.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <div className="font-medium">{t.coins.toLocaleString()} monedas</div>
                  <div className="text-xs text-gray-500">Ref: {t.reference}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${statusColor(t.status)}`}>{statusLabel(t.status)}</div>
                  <div className="text-xs text-gray-500">${t.priceUSD.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
