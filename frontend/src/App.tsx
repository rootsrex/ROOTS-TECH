import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import DancerProfile from './pages/DancerProfile';
import LiveRoom from './pages/LiveRoom';
import DancerDashboard from './pages/DancerDashboard';
import ViewerWallet from './pages/ViewerWallet';

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-brand-400 text-xl animate-pulse">Cargando...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <Routes>
          {/* Landing pública — sin padding del container */}
          <Route path="/" element={<Landing />} />

          {/* Páginas con layout container */}
          <Route path="/*" element={
            <main className="container mx-auto px-4 py-6 max-w-6xl">
              <Routes>
                <Route path="explore" element={<Explore />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="dancer/:id" element={<DancerProfile />} />
                <Route path="live/:sessionId" element={<LiveRoom />} />
                <Route path="dashboard" element={
                  <ProtectedRoute role="DANCER"><DancerDashboard /></ProtectedRoute>
                } />
                <Route path="wallet" element={
                  <ProtectedRoute><ViewerWallet /></ProtectedRoute>
                } />
              </Routes>
            </main>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
