import { useState, useEffect } from 'react';
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
  stickerPacks: Array<{ priceUSD: number }>;
  _count: { sessions: number; receivedStickers: number };
}

const FAQS = [
  {
    q: '¿Cómo cobro mis ganancias en Ecuador?',
    a: 'Puedes retirar tu dinero directamente a tu cuenta Takenos, cuenta bancaria ecuatoriana, o vía Payphone. El proceso toma 1-2 días hábiles.',
  },
  {
    q: '¿Cuánto cobra la plataforma?',
    a: 'DancePay cobra solo el 20% de comisión por cada sticker recibido. El 80% restante va directamente a tu billetera y puedes retirarlo cuando quieras.',
  },
  {
    q: '¿Cuánto cuesta un sticker?',
    a: 'Tú como bailarina defines el precio de cada sticker, desde $0.50 hasta $500. Puedes crear diferentes tipos: un saludo, un baile básico, un show premium, etc.',
  },
  {
    q: '¿Necesito una cámara profesional?',
    a: 'No. Puedes hacer tus shows desde el celular. Lo importante es bailar y conectar con tu audiencia.',
  },
  {
    q: '¿Los espectadores necesitan registrarse?',
    a: 'Sí, necesitan crear una cuenta gratis para poder enviar stickers. Ver los shows en vivo es gratuito.',
  },
  {
    q: '¿Es seguro para mis datos bancarios?',
    a: 'Sí. Tus datos de pago se guardan encriptados y nunca se comparten con terceros. Los retiros se verifican manualmente antes de procesarse.',
  },
];

const STATS = [
  { value: '80%', label: 'Para la bailarina' },
  { value: '$1', label: 'Mínimo por sticker' },
  { value: '2 días', label: 'Para cobrar' },
  { value: '100%', label: 'Tú pones el precio' },
];

const contentLevelBadge: Record<string, string> = {
  BASIC: 'bg-green-900/60 text-green-300 border border-green-700',
  PREMIUM: 'bg-purple-900/60 text-purple-300 border border-purple-700',
  EXCLUSIVE: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
};
const contentLevelLabel: Record<string, string> = {
  BASIC: 'Básico', PREMIUM: 'Premium', EXCLUSIVE: 'Exclusivo',
};

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [floatingEmojis] = useState(['💃', '🔥', '💎', '⭐', '🌟', '💫', '✨', '🎵', '🎶', '❤️']);

  useEffect(() => {
    api.get('/dancers').then(r => setDancers(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Fondo degradado */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Emojis flotantes decorativos */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          {floatingEmojis.map((e, i) => (
            <span
              key={i}
              className="absolute text-2xl opacity-20 animate-bounce"
              style={{
                left: `${5 + (i * 9.5)}%`,
                top: `${10 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            >
              {e}
            </span>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-900/50 border border-brand-700 rounded-full px-4 py-1.5 text-sm text-brand-300 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Plataforma 100% ecuatoriana
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Cobra bailando.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-pink-300">
              En tiempo real.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            La primera plataforma ecuatoriana donde las bailarinas ganan dinero real
            enviando stickers en vivo. Retira directo a <strong className="text-white">Takenos</strong> o tu banco.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              state={{ defaultRole: 'DANCER' }}
              className="btn-primary text-lg px-8 py-4 rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50 transition-shadow"
            >
              💃 Quiero cobrar bailando
            </Link>
            <Link
              to="/register"
              state={{ defaultRole: 'VIEWER' }}
              className="btn-secondary text-lg px-8 py-4 rounded-xl"
            >
              👁 Quiero ver shows
            </Link>
          </div>

          <p className="text-sm text-gray-600 mt-4">Gratis para registrarse · Sin tarjeta requerida</p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-600 text-xs flex flex-col items-center gap-1">
          <span>Descubre más</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-gray-800 bg-gray-900/50 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-black text-brand-400 mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">¿Cómo funciona?</h2>
          <p className="text-gray-400 text-lg">En 3 pasos, simple y directo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Línea conectora */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-brand-600 to-brand-400" />

          {[
            {
              icon: '🎭',
              step: '01',
              title: 'Crea tu perfil',
              desc: 'Regístrate como bailarina, sube tu foto y define tus stickers con el precio que tú quieras. Desde $1 hasta $500.',
            },
            {
              icon: '🔴',
              step: '02',
              title: 'Baila en vivo',
              desc: 'Inicia una sesión en vivo. Tu audiencia te envía stickers mientras bailas. El dinero entra en tiempo real.',
            },
            {
              icon: '💸',
              step: '03',
              title: 'Cobra en Ecuador',
              desc: 'Retira tus ganancias cuando quieras directo a Takenos, tu cuenta bancaria o Payphone. En 1-2 días hábiles.',
            },
          ].map((step) => (
            <div key={step.step} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl bg-brand-900/50 border border-brand-700 flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>
              <div className="text-xs text-brand-500 font-bold mb-2 tracking-widest">PASO {step.step}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARA BAILARINAS ── */}
      <section className="py-24 bg-gradient-to-b from-gray-950 via-brand-950/20 to-gray-950">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-brand-900/50 border border-brand-700 rounded-full px-3 py-1 text-xs text-brand-300 mb-4">
                Para bailarinas
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                Tu talento vale dinero.
                <br />
                <span className="text-brand-400">Tú decides cuánto.</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Crea tus propios stickers: un saludo, 30 segundos de baile, un show privado.
                Pon el precio que tú quieras y cobra cada vez que alguien te los envíe.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  '✅ Crea stickers con el precio que tú decides',
                  '✅ Cobra el 80% de cada sticker recibido',
                  '✅ Retira a Takenos, banco o Payphone',
                  '✅ Gestiona todo desde tu dashboard',
                  '✅ Sesiones en vivo con chat en tiempo real',
                ].map((item) => (
                  <li key={item} className="text-gray-300 text-sm">{item}</li>
                ))}
              </ul>
              <Link to="/register" state={{ defaultRole: 'DANCER' }} className="btn-primary inline-block px-8 py-3 rounded-xl">
                Empezar a cobrar →
              </Link>
            </div>

            {/* Preview del dashboard */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600 ml-2">Mi Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-brand-400 text-lg font-black">$47.20</div>
                  <div className="text-xs text-gray-500 mt-0.5">Disponible</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-green-400 text-lg font-black">$121</div>
                  <div className="text-xs text-gray-500 mt-0.5">Ganado</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <div className="text-gray-300 text-lg font-black">$74</div>
                  <div className="text-xs text-gray-500 mt-0.5">Retirado</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3 font-semibold">MIS STICKERS</div>
              {[
                { emoji: '👋', name: 'Saludo', price: '$1.00', level: 'BASIC' },
                { emoji: '💃', name: 'Baile Básico', price: '$3.00', level: 'BASIC' },
                { emoji: '🔥', name: 'Baile Premium', price: '$10.00', level: 'PREMIUM' },
                { emoji: '💎', name: 'Show Exclusivo', price: '$50.00', level: 'EXCLUSIVE' },
              ].map((pack) => (
                <div key={pack.name} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  <span className="text-xl">{pack.emoji}</span>
                  <span className="text-sm flex-1">{pack.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${contentLevelBadge[pack.level]}`}>
                    {contentLevelLabel[pack.level]}
                  </span>
                  <span className="text-brand-400 font-bold text-sm">{pack.price}</span>
                </div>
              ))}
              <button className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                🔴 Iniciar sesión en vivo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA ESPECTADORES ── */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Preview sala en vivo */}
          <div className="order-2 md:order-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800 aspect-video relative flex items-center justify-center">
              <div className="text-6xl">💃</div>
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-bold">🔴 EN VIVO</span>
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">👁 247</span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="bg-brand-600/80 text-white text-xs px-2 py-0.5 rounded font-bold">💰 $89.40</span>
              </div>
              {/* Stickers flotando */}
              {['💃', '🔥', '⭐'].map((e, i) => (
                <div key={i} className="absolute text-3xl opacity-70 animate-bounce"
                  style={{ bottom: `${30 + i * 20}%`, left: `${15 + i * 25}%`, animationDelay: `${i * 0.5}s` }}>
                  {e}
                </div>
              ))}
            </div>
            <div className="p-4 space-y-2">
              <div className="text-xs text-gray-500 font-semibold">STICKERS DISPONIBLES</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: '👋', name: 'Saludo', price: '$1' },
                  { emoji: '💃', name: 'Baile', price: '$3' },
                  { emoji: '🔥', name: 'Premium', price: '$10' },
                  { emoji: '💎', name: 'Exclusivo', price: '$50' },
                ].map((s) => (
                  <div key={s.name} className="bg-gray-800 rounded-lg p-2.5 flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition-colors">
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <div className="text-xs font-medium">{s.name}</div>
                      <div className="text-brand-400 text-xs font-bold">{s.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="inline-block bg-blue-900/50 border border-blue-700 rounded-full px-3 py-1 text-xs text-blue-300 mb-4">
              Para espectadores
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6">
              Apoya a tus
              <br />
              <span className="text-brand-400">favoritas en vivo.</span>
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Descubre bailarinas increíbles, entra a sus shows en vivo y envíales stickers.
              Cada sticker es dinero real que llega directamente a ellas.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                '✅ Explora shows en vivo gratis',
                '✅ Envía stickers desde $1',
                '✅ Tu mensaje aparece en pantalla',
                '✅ Recarga con tarjeta o Payphone',
                '✅ Chat en tiempo real con la bailarina',
              ].map((item) => (
                <li key={item} className="text-gray-300 text-sm">{item}</li>
              ))}
            </ul>
            <Link to="/register" state={{ defaultRole: 'VIEWER' }} className="btn-secondary inline-block px-8 py-3 rounded-xl">
              Empezar gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BAILARINAS ACTIVAS ── */}
      {dancers.length > 0 && (
        <section className="py-20 bg-gray-900/30 border-y border-gray-800">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-3">Bailarinas en la plataforma</h2>
              <p className="text-gray-400">Descubre quiénes ya están cobrando</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dancers.map((dancer) => {
                const minPrice = dancer.stickerPacks.length > 0
                  ? Math.min(...dancer.stickerPacks.map(p => p.priceUSD))
                  : null;
                return (
                  <Link
                    key={dancer.id}
                    to={`/dancer/${dancer.id}`}
                    className="bg-gray-900 border border-gray-800 hover:border-brand-600 rounded-xl p-4 transition-all group hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-xl">
                          {dancer.avatarUrl
                            ? <img src={dancer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            : '💃'}
                        </div>
                        {dancer.isLive && (
                          <span className="absolute -bottom-0.5 -right-0.5 bg-red-500 text-white text-[10px] px-1 rounded-full font-bold">LIVE</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-sm group-hover:text-brand-400 transition-colors truncate">
                            {dancer.displayName}
                          </span>
                          {dancer.isVerified && <span className="text-xs">✅</span>}
                        </div>
                        <div className="text-xs text-gray-500">@{dancer.user.username}</div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-600">
                          {minPrice !== null && <span className="text-brand-400 font-semibold">Desde ${minPrice.toFixed(2)}</span>}
                          <span className={`px-1.5 py-0.5 rounded ${contentLevelBadge[dancer.contentLevel] || ''}`}>
                            {contentLevelLabel[dancer.contentLevel]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link to="/explore" className="btn-secondary inline-block px-6 py-2.5 rounded-xl text-sm">
                Ver todas las bailarinas →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── MÉTODOS DE PAGO ECUADOR ── */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-4">Cobras en Ecuador, sin complicaciones</h2>
        <p className="text-gray-400 mb-12">Usamos los métodos de pago que ya conoces</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: '📱', name: 'Takenos', desc: 'Transferencia inmediata a tu app Takenos. El método más rápido.' },
            { icon: '🏦', name: 'Transferencia Bancaria', desc: 'Banco Pichincha, Produbanco, Banco del Pacífico y más.' },
            { icon: '💳', name: 'Payphone', desc: 'Retira directo a tu cuenta Payphone. Disponible 24/7.' },
          ].map((m) => (
            <div key={m.name} className="bg-gray-900 border border-gray-800 hover:border-brand-700 rounded-xl p-6 transition-colors">
              <div className="text-4xl mb-3">{m.icon}</div>
              <h3 className="font-bold mb-2">{m.name}</h3>
              <p className="text-sm text-gray-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-gray-900/30 border-y border-gray-800">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <span className="font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                  <span className={`text-brand-400 text-xl flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/20 via-transparent to-brand-900/20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Empieza hoy.
            <br />
            <span className="text-brand-400">Es gratis.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Únete a las bailarinas que ya están cobrando por sus shows en vivo.
            Sin costo de registro, sin mensualidad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              state={{ defaultRole: 'DANCER' }}
              className="btn-primary text-lg px-10 py-4 rounded-xl shadow-lg shadow-brand-600/30"
            >
              💃 Soy bailarina
            </Link>
            <Link
              to="/register"
              state={{ defaultRole: 'VIEWER' }}
              className="btn-secondary text-lg px-10 py-4 rounded-xl"
            >
              👁 Soy espectador
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="text-2xl font-black text-brand-400 mb-3">💃 DancePay</div>
              <p className="text-sm text-gray-500 max-w-xs">
                La plataforma ecuatoriana para que las bailarinas cobren por sus shows en vivo mediante stickers digitales.
              </p>
              <div className="flex gap-3 mt-4">
                {['📸', '🐦', '📘', '▶️'].map((icon, i) => (
                  <div key={i} className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-base">
                    {icon}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-gray-300">Plataforma</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/explore" className="hover:text-white transition-colors">Explorar bailarinas</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Ingresar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-gray-300">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><span className="hover:text-white cursor-pointer transition-colors">Términos de uso</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Privacidad</span></li>
                <li><span className="hover:text-white cursor-pointer transition-colors">Contacto</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <span>© 2024 DancePay. Hecho en Ecuador 🇪🇨</span>
            <span>20% comisión · 80% para la bailarina · Retiros en 1-2 días hábiles</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
