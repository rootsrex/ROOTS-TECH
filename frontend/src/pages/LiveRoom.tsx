import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StickerPanel from '../components/StickerPanel';

interface Session {
  id: string;
  title: string;
  viewerCount: number;
  totalEarned: number;
  endedAt: string | null;
  dancer: {
    id: string;
    displayName: string;
    avatarUrl: string;
    contentLevel: string;
    stickerPacks: Array<{ id: string; name: string; emoji: string; description: string; priceUSD: number; contentLevel: string }>;
  };
}

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  isSticker?: boolean;
  stickerEmoji?: string;
}

interface FloatingSticker {
  id: string;
  emoji: string;
  x: number;
}

export default function LiveRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingStickers, setFloatingStickers] = useState<FloatingSticker[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/sessions/${sessionId}`).then(r => {
      setSession(r.data);
      setViewerCount(r.data.viewerCount);
      setTotalEarned(r.data.totalEarned);
      if (r.data.endedAt) setEnded(true);
    }).finally(() => setLoading(false));
  }, [sessionId]);

  const showFloatingSticker = useCallback((emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = 10 + Math.random() * 80;
    setFloatingStickers(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloatingStickers(prev => prev.filter(s => s.id !== id)), 2100);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('token');
    const socket = io('/', { auth: { token } });
    socketRef.current = socket;

    socket.emit('session:join', sessionId);

    socket.on('viewer:joined', ({ count }: { count: number }) => setViewerCount(count));
    socket.on('viewer:left', ({ count }: { count: number }) => setViewerCount(count));

    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-99), msg]);
    });

    socket.on('sticker:received', ({ transaction }: any) => {
      const { sender, stickerPack, quantity, dancerEarning, message } = transaction;
      showFloatingSticker(stickerPack.emoji);
      setChatMessages(prev => [...prev.slice(-99), {
        userId: sender.userId || 'system',
        username: sender.username,
        message: `envió ${quantity}x ${stickerPack.emoji} ${stickerPack.name}${message ? ` "${message}"` : ''} (+$${dancerEarning.toFixed(2)})`,
        timestamp: new Date().toISOString(),
        isSticker: true,
        stickerEmoji: stickerPack.emoji,
      }]);
      setTotalEarned(prev => prev + dancerEarning);
    });

    socket.on('session:ended', () => setEnded(true));

    return () => {
      socket.emit('session:leave', sessionId);
      socket.disconnect();
    };
  }, [sessionId, showFloatingSticker]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:message', { sessionId, message: chatInput.trim() });
    setChatInput('');
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando sesión...</div>;
  if (!session) return <div className="text-center py-20 text-red-400">Sesión no encontrada</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Video / Stage area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {ended ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <div className="text-4xl mb-3">🎭</div>
                <div className="text-xl font-bold">Show finalizado</div>
                <div className="text-sm mt-1">Total recaudado: <span className="text-brand-400">${totalEarned.toFixed(2)}</span></div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <div className="text-6xl mb-3">💃</div>
                <div className="text-sm">Stream de video en vivo</div>
                <div className="text-xs text-gray-700 mt-1">(integrar con WebRTC)</div>
              </div>
            )}

            {/* Floating stickers overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {floatingStickers.map(s => (
                <div
                  key={s.id}
                  className="absolute bottom-8 sticker-float text-4xl"
                  style={{ left: `${s.x}%` }}
                >
                  {s.emoji}
                </div>
              ))}
            </div>

            {/* Live badge */}
            {!ended && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                  🔴 EN VIVO
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  👁 {viewerCount}
                </span>
              </div>
            )}

            {/* Earnings badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-brand-600/80 text-white text-xs px-2 py-1 rounded font-bold">
                💰 ${totalEarned.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Session info */}
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-xl">
                {session.dancer.avatarUrl ? (
                  <img src={session.dancer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : '💃'}
              </div>
              <div>
                <Link to={`/dancer/${session.dancer.id}`} className="font-semibold hover:text-brand-400">
                  {session.dancer.displayName}
                </Link>
                <div className="text-sm text-gray-400">{session.title}</div>
              </div>
            </div>
          </div>

          {/* Sticker panel */}
          {!ended && (
            <div className="card">
              <h3 className="font-bold mb-3">Enviar sticker 💫</h3>
              {!user ? (
                <p className="text-sm text-gray-500">
                  <Link to="/login" className="text-brand-400">Inicia sesión</Link> para enviar stickers.
                </p>
              ) : (
                <StickerPanel
                  packs={session.dancer.stickerPacks}
                  dancerId={session.dancer.id}
                  sessionId={sessionId}
                  onStickerSent={(pack) => showFloatingSticker(pack.emoji)}
                  onSuccess={() => {}}
                />
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="card flex flex-col h-[500px] lg:h-auto lg:max-h-[680px]">
          <h3 className="font-bold mb-3 text-sm">Chat en vivo</h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
            {chatMessages.length === 0 && (
              <p className="text-xs text-gray-600 text-center mt-4">El chat está vacío</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`text-xs ${msg.isSticker ? 'bg-brand-900/30 rounded p-1.5' : ''}`}>
                <span className="font-semibold text-brand-400">{msg.username}</span>
                {' '}
                <span className={msg.isSticker ? 'text-yellow-300' : 'text-gray-300'}>
                  {msg.message}
                </span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {user && !ended && (
            <div className="flex gap-2">
              <input
                type="text"
                className="input text-sm flex-1 py-1.5"
                placeholder="Escribe algo..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                maxLength={200}
              />
              <button onClick={sendChat} className="btn-primary py-1.5 px-3 text-sm">
                ➤
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
