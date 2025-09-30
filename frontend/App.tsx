import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerPortal from './pages/customer/CustomerPortal';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StoreFront from './pages/storefront/StoreFront';
import ProductDetails from './pages/storefront/ProductDetails';
import Cart from './pages/storefront/Cart';
import Checkout from './pages/storefront/Checkout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('manager');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<StoreFront />} />
      <Route path="/product/:slug" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route 
        path="/admin/*" 
        element={
          user && isAdmin ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/account/*" 
        element={
          user ? (
            <CustomerPortal />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Redirects */}
      <Route 
        path="/dashboard" 
        element={
          <Navigate to={isAdmin ? "/admin" : "/account"} replace />
        } 
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <AppRoutes />
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
