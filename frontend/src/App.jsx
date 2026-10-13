import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar   from './components/Navbar';
import Home     from './pages/Home';
import Login    from './pages/Login';
import Signup   from './pages/Signup';
import Plants   from './pages/Plants';
import Listings from './pages/Listings';
import Requests from './pages/Requests';
import Chat     from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Profile  from './pages/Profile';

import GreenLinkAIAssistant from './components/GreenLinkAIAssistant';

// Pages that don't need the nav offset (they handle their own full-screen layout)
const NO_NAV_PAGES = ['/login', '/signup'];

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/signup"   element={<Signup />} />
        <Route path="/plants"   element={<PrivateRoute><Plants /></PrivateRoute>} />
        <Route path="/listings" element={<PrivateRoute><Listings /></PrivateRoute>} />
        <Route path="/requests" element={<PrivateRoute><Requests /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/chat/:requestId" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
      {user && <GreenLinkAIAssistant />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
