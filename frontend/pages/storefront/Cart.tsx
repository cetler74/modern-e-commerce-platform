import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Mock cart data - in a real app this would come from context/state management
const mockCartItems = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    variant: 'Black',
    price: 299.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    variant: 'Space Gray',
    price: 399.99,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'
  }
];

export default function Cart() {
  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const shipping = 10;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Continue Shopping</span>
              </Link>
            </Button>
            <Link to="/" className="text-2xl font-bold text-blue-600">
              ModernCommerce
            </Link>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {mockCartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Button asChild>
                <Link to="/">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {mockCartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.variant}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Button variant="outline" size="sm">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">${shipping.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6" size="lg" asChild>
                    <Link to="/checkout">Proceed to Checkout</Link>
                  </Button>

                  <div className="mt-4 text-center">
                    <Button variant="ghost" asChild>
                      <Link to="/">Continue Shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
