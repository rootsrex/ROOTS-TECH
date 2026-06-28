import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CoinPackage { id: string; name: string; coins: number; priceUSD: number; bonus: number; }
interface PaymentInfo {
  takenosBonusCoins: number; payoutDay: string;
  takenosAdminId: string; bankName: string; bankAccount: string; bankAccountHolder: string;
  usdtWallet: string; usdtNetwork: string;
}
interface TopUp { id: string; coins: number; bonusCoins: number; priceUSD: number; reference: string; status: string; method: string; createdAt: string; }

type Method = 'TAKENOS' | 'CARD' | 'TRANSFER' | 'USDT';

const METHOD_INFO: Record<Method, { label: string; icon: string; desc: string }> = {
  TAKENOS:  { label: 'TakeNos',             icon: '📲', desc: '¡Bonus de monedas!' },
  CARD:     { label: 'Tarjeta',             icon: '💳', desc: 'Visa / Mastercard' },
  TRANSFER: { label: 'Transferencia',       icon: '🏦', desc: 'Banco Ecuador' },
  USDT:     { label: 'USDT Crypto',         icon: '💰', desc: 'Tether TRC20 / ERC20' },
};

const statusColor = (s: string) =>
  s === 'COMPLETED' ? 'text-green-400' : s === 'REJECTED' ? 'text-red-400' : 'text-yellow-400';
const statusLabel = (s: string) =>
  s === 'COMPLETED' ? '✅ Aprobada' : s === 'REJECTED' ? '❌ Rechazada' : '⏳ Pendiente';

export default function CoinsShop() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [myTopUps, setMyTopUps] = useState<TopUp[]>([]);
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [method, setMethod] = useState<Method>('TAKENOS');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/gifts/packages').then(r => setPackages(r.data));
    api.get('/gifts/payment-info').then(r => setInfo(r.data));
    api.get('/gifts/my-topups').then(r => setMyTopUps(r.data));
  }, []);

  const totalCoins = selected ? selected.coins + selected.bonus + (method === 'TAKENOS' ? (info?.takenosBonusCoins ?? 0.5) : 0) : 0;

  const handleRequest = async () => {
    if (!selected || !reference.trim()) { setError('Selecciona un paquete e ingresa tu referencia'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/gifts/topup', { packageId: selected.id, reference: reference.trim(), method });
      setSuccess(`¡Solicitud enviada! Recibirás ${totalCoins} monedas cuando el admin confirme tu pago.`);
      setSelected(null); setReference('');
      const r = await api.get('/gifts/my-topups');
      setMyTopUps(r.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Error al enviar solicitud');
    } finally { setLoading(false); }
  };

  const refPlaceholder: Record<Method, string> = {
    TAKENOS: 'Número de referencia TakeNos (ej: TK-123456)',
    CARD: 'Últimos 4 dígitos de tu tarjeta + aprobación',
    TRANSFER: 'Número de comprobante bancario',
    USDT: 'Hash de la transacción USDT',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🪙 Recargar Monedas</h1>
        <div className="bg-brand-900/40 border border-brand-700 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-gray-400">Tu saldo</div>
          <div className="text-xl font-bold text-brand-300">{(user as any)?.wallet?.coinBalance?.toFixed(1) ?? '0'} 🪙</div>
        </div>
      </div>

      {/* Aviso cobros miércoles */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3 text-sm text-blue-300 flex items-start gap-2">
        <span className="text-lg">📅</span>
        <span>Las bailarinas y bailarines reciben sus pagos <strong>todos los miércoles</strong> vía TakeNos.</span>
      </div>

      {/* Paquetes */}
      <div className="card">
        <h2 className="font-semibold mb-3 text-gray-300">1. Elige tu paquete</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {packages.map(pkg => (
            <button key={pkg.id} onClick={() => setSelected(pkg)}
              className={`rounded-xl border-2 p-3 text-center transition-all ${selected?.id === pkg.id ? 'border-brand-400 bg-brand-900/30' : 'border-gray-700 hover:border-gray-500'}`}
            >
              <div className="text-2xl font-bold text-brand-300">{pkg.coins.toLocaleString()}</div>
              {pkg.bonus > 0 && <div className="text-xs text-green-400">+{pkg.bonus} bonus</div>}
              <div className="text-xs text-gray-400 mt-0.5">{pkg.name}</div>
              <div className="text-lg font-bold mt-1">${pkg.priceUSD.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Método de pago */}
      <div className="card">
        <h2 className="font-semibold mb-3 text-gray-300">2. Elige cómo pagar</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(METHOD_INFO) as [Method, typeof METHOD_INFO[Method]][]).map(([key, m]) => (
            <button key={key} onClick={() => setMethod(key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${method === key ? 'border-brand-400 bg-brand-900/20' : 'border-gray-700 hover:border-gray-600'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{m.icon}</span>
                <div>
                  <div className="font-medium text-sm">{m.label}</div>
                  <div className={`text-xs ${key === 'TAKENOS' ? 'text-green-400 font-medium' : 'text-gray-500'}`}>{m.desc}</div>
                </div>
              </div>
              {key === 'TAKENOS' && (
                <div className="mt-2 text-xs bg-green-900/40 text-green-300 rounded-lg px-2 py-1">
                  🎁 +{info?.takenosBonusCoins ?? 0.5} moneda extra por pago
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Instrucciones según método */}
      {selected && info && (
        <div className="card border border-brand-700/40">
          <h2 className="font-semibold mb-3">3. Realiza el pago</h2>

          {method === 'TAKENOS' && info.takenosAdminId && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm space-y-1">
              <p className="text-gray-300">Envía <strong className="text-white">${selected.priceUSD.toFixed(2)} USD</strong> por TakeNos a:</p>
              <p className="text-brand-300 font-mono text-lg font-bold">{info.takenosAdminId}</p>
              <p className="text-green-400 text-xs">🎁 Recibirás +{info.takenosBonusCoins} moneda de bonus</p>
            </div>
          )}

          {method === 'CARD' && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm space-y-1">
              <p className="text-gray-300">Contáctanos por WhatsApp para procesar tu pago con tarjeta:</p>
              <p className="text-brand-300 font-bold">Monto: ${selected.priceUSD.toFixed(2)} USD</p>
              <p className="text-xs text-gray-400">Aceptamos Visa y Mastercard. Se solicita autorización por mensaje.</p>
            </div>
          )}

          {method === 'TRANSFER' && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm space-y-2">
              <p className="text-gray-300">Transfiere <strong className="text-white">${selected.priceUSD.toFixed(2)} USD</strong> a:</p>
              {info.bankName && <p className="text-gray-200"><span className="text-gray-500">Banco:</span> <strong>{info.bankName}</strong></p>}
              {info.bankAccount && <p className="text-gray-200 font-mono"><span className="text-gray-500">Cuenta:</span> <strong>{info.bankAccount}</strong></p>}
              {info.bankAccountHolder && <p className="text-gray-200"><span className="text-gray-500">A nombre de:</span> <strong>{info.bankAccountHolder}</strong></p>}
            </div>
          )}

          {method === 'USDT' && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3 text-sm space-y-1">
              <p className="text-gray-300">Envía <strong className="text-white">${selected.priceUSD.toFixed(2)} USDT</strong> ({info.usdtNetwork}) a:</p>
              {info.usdtWallet
                ? <p className="text-brand-300 font-mono text-xs break-all">{info.usdtWallet}</p>
                : <p className="text-yellow-400 text-xs">⚠️ Wallet USDT no configurada aún. Contáctanos.</p>
              }
            </div>
          )}

          <div className="bg-brand-900/20 border border-brand-800 rounded-lg p-2 mb-3 text-center">
            <span className="text-sm text-gray-400">Total que recibirás: </span>
            <span className="text-brand-300 font-bold text-lg">{totalCoins} 🪙</span>
            {method === 'TAKENOS' && <span className="text-xs text-green-400 ml-1">(incluye bonus)</span>}
          </div>

          {error && <div className="text-sm text-red-400 bg-red-900/30 rounded-lg p-2 mb-3">{error}</div>}
          {success && <div className="text-sm text-green-400 bg-green-900/30 rounded-lg p-2 mb-3">{success}</div>}

          <input className="input mb-2" placeholder={refPlaceholder[method]}
            value={reference} onChange={e => setReference(e.target.value)} />
          <button className="btn-primary w-full" onClick={handleRequest} disabled={loading}>
            {loading ? 'Enviando...' : '✅ Confirmar pago y solicitar monedas'}
          </button>
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
                  <div className="font-medium">{t.coins} {t.bonusCoins > 0 && <span className="text-green-400 text-xs">+{t.bonusCoins}🎁</span>} 🪙</div>
                  <div className="text-xs text-gray-500">{METHOD_INFO[t.method as Method]?.icon} {METHOD_INFO[t.method as Method]?.label} · Ref: {t.reference.slice(0, 20)}</div>
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
