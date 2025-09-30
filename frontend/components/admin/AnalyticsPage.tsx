import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const { getBackend } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics-metrics', period],
    queryFn: () => getBackend().analytics.getDashboardMetrics({ period }),
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
            <span className="ml-1">from previous period</span>
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Revenue over time for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Revenue chart would be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Premium Headphones', revenue: 15420, change: 12.5 },
                { name: 'Smart Watch', revenue: 12380, change: 8.2 },
                { name: 'Wireless Earbuds', revenue: 9850, change: -2.1 },
                { name: 'Laptop Stand', revenue: 7200, change: 15.8 },
                { name: 'USB-C Hub', revenue: 5900, change: 5.4 }
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-600">${product.revenue.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${product.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.change >= 0 ? '+' : ''}{product.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'Processing', count: 24, color: 'bg-blue-500' },
                { status: 'Shipped', count: 18, color: 'bg-green-500' },
                { status: 'Pending', count: 12, color: 'bg-yellow-500' },
                { status: 'Delivered', count: 156, color: 'bg-emerald-500' },
                { status: 'Cancelled', count: 3, color: 'bg-red-500' }
              ].map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>New customers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Customer acquisition chart</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Metrics</CardTitle>
            <CardDescription>Active subscription performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Subscriptions</span>
                <span className="font-medium">{metrics?.activeSubscriptions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Monthly Recurring Revenue</span>
                <span className="font-medium">${(metrics?.mrr || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Churn Rate</span>
                <span className="font-medium">{(metrics?.churnRate || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Revenue Per User</span>
                <span className="font-medium">${(metrics?.arpu || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
