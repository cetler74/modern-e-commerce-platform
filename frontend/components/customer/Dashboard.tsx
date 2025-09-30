import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, CreditCard, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { getBackend } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: () => getBackend().users.getProfile(),
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getBackend().orders.list({ limit: 5 }),
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['customer-subscriptions'],
    queryFn: () => getBackend().subscriptions.list(),
  });

  const stats = [
    {
      title: 'Total Orders',
      value: recentOrders?.length || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: subscriptions?.filter(s => s.status === 'active').length || 0,
      icon: Package,
      color: 'text-green-600',
    },
    {
      title: 'Total Spent',
      value: '$1,234',
      icon: CreditCard,
      color: 'text-purple-600',
    },
    {
      title: 'Loyalty Points',
      value: '2,450',
      icon: Star,
      color: 'text-yellow-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your latest purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders?.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Order #{order.id.slice(0, 8)}</div>
                    <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${order.total}</div>
                    <div className="text-sm text-gray-600 capitalize">{order.status}</div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Orders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>Manage your recurring orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions?.filter(s => s.status === 'active').slice(0, 3).map((subscription) => (
                <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{subscription.productName}</div>
                    <div className="text-sm text-gray-600">
                      Next delivery: {new Date(subscription.nextDelivery).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${subscription.price}</div>
                    <div className="text-sm text-gray-600 capitalize">{subscription.frequency}</div>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No active subscriptions</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Manage Subscriptions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-16 flex flex-col">
              <ShoppingBag className="h-6 w-6 mb-2" />
              Browse Products
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <Package className="h-6 w-6 mb-2" />
              Track Order
            </Button>
            <Button variant="outline" className="h-16 flex flex-col">
              <CreditCard className="h-6 w-6 mb-2" />
              Payment Methods
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}