import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Dashboard from '../../components/admin/Dashboard';
import ProductsManagement from '../../components/admin/ProductsManagement';
import OrdersManagement from '../../components/admin/OrdersManagement';
import UsersManagement from '../../components/admin/UsersManagement';
import SubscriptionsManagement from '../../components/admin/SubscriptionsManagement';
import BlogManagement from '../../components/admin/BlogManagement';
import AnalyticsPage from '../../components/admin/AnalyticsPage';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsManagement />} />
        <Route path="/orders" element={<OrdersManagement />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/subscriptions" element={<SubscriptionsManagement />} />
        <Route path="/blog" element={<BlogManagement />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </AdminLayout>
  );
}
