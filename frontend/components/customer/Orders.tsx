import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Download, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import backend from '~backend/client';

export default function Orders() {
  const [filter, setFilter] = useState('all');
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['customer-orders', filter],
    queryFn: () => backend.orders.list({ status: filter !== 'all' ? filter : undefined }),
  });

  const orders = ordersResponse?.orders || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${order.totalAmount.toFixed(2)}</div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Order Items */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Items</h4>
                    <div className="space-y-2">
                      {(orders.find(o => o.id === order.id) as any)?.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="font-medium">${item.price}</div>
                        </div>
                      )) || (
                        <div className="text-gray-500">No items details available</div>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Order #{order.orderNumber}</div>
                      <div>Email: {order.customerEmail}</div>
                      <div>Total: ${order.totalAmount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                    {order.status === 'delivered' && (
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Return/Exchange
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">No orders found</div>
              <Button>Start Shopping</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}