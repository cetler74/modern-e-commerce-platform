import { Routes, Route } from 'react-router-dom';
import CustomerLayout from '../../components/customer/CustomerLayout';
import Dashboard from '../../components/customer/Dashboard';
import Orders from '../../components/customer/Orders';
import Subscriptions from '../../components/customer/Subscriptions';
import Profile from '../../components/customer/Profile';
import Addresses from '../../components/customer/Addresses';

export default function CustomerPortal() {
  return (
    <CustomerLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/addresses" element={<Addresses />} />
      </Routes>
    </CustomerLayout>
  );
}
