import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Package, ShoppingBag, MapPin, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/customer', icon: User },
    { name: 'Orders', href: '/customer/orders', icon: ShoppingBag },
    { name: 'Subscriptions', href: '/customer/subscriptions', icon: Package },
    { name: 'Profile', href: '/customer/profile', icon: Settings },
    { name: 'Addresses', href: '/customer/addresses', icon: MapPin },
  ];

  const isActive = (href: string) => {
    if (href === '/customer') {
      return location.pathname === '/customer';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">ModernCommerce</h1>
        </div>
        
        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-0 right-0 px-3">
          <button
            onClick={logout}
            className="group flex w-full items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-8 px-8">
          {children}
        </main>
      </div>
    </div>
  );
}