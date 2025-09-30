import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const { getBackend } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => getBackend().analytics.getDashboardMetrics({}),
  });

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency';
  }) => {
    const isPositive = change >= 0;
    const formattedValue = format === 'currency' 
      ? `$${value.toLocaleString()}` 
      : value.toLocaleString();

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formattedValue}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">from last period</span>
          </p>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          change={metrics?.revenueGrowth || 0}
          icon={CreditCard}
          format="currency"
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders || 0}
          change={metrics?.orderGrowth || 0}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers || 0}
          change={metrics?.customerGrowth || 0}
          icon={Users}
        />
        <MetricCard
          title="Active Subscriptions"
          value={metrics?.activeSubscriptions || 0}
          change={metrics?.subscriptionGrowth || 0}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders and customer activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New order #ORD-2024001</p>
                  <p className="text-xs text-gray-600">Customer: john@example.com</p>
                </div>
                <div className="text-sm font-medium">$299.99</div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New subscription created</p>
                  <p className="text-xs text-gray-600">Customer: jane@example.com</p>
                </div>
                <div className="text-sm font-medium">Monthly</div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Order #ORD-2024000 shipped</p>
                  <p className="text-xs text-gray-600">Tracking: 1Z123456789</p>
                </div>
                <div className="text-sm font-medium">Shipped</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Add New Product</div>
                <div className="text-xs text-gray-600">Create a new product listing</div>
              </button>
              
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Process Orders</div>
                <div className="text-xs text-gray-600">Review pending orders</div>
              </button>
              
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Manage Users</div>
                <div className="text-xs text-gray-600">Add or modify user accounts</div>
              </button>
              
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">View Analytics</div>
                <div className="text-xs text-gray-600">Detailed performance metrics</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
