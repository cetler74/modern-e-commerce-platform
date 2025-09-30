import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

const mockCartItems = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    variant: 'Black',
    price: 299.99,
    quantity: 1,
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    variant: 'Space Gray',
    price: 399.99,
    quantity: 2,
  }
];

export default function Checkout() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    shippingMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    billingAddressSame: true
  });

  const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const shipping = 10;
  const total = subtotal + tax + shipping;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const steps = [
    { id: 1, title: 'Information', icon: Package },
    { id: 2, title: 'Shipping', icon: MapPin },
    { id: 3, title: 'Payment', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/cart" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cart</span>
              </Link>
            </Button>
            <Link to="/" className="text-2xl font-bold text-blue-600">
              ModernCommerce
            </Link>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${step.id <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                  }
                `}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 font-medium ${
                  step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-4 ${
                    step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company (optional)</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address1">Address</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e) => handleInputChange('address1', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e) => handleInputChange('address2', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to shipping
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup 
                    value={formData.shippingMethod} 
                    onValueChange={(value) => handleInputChange('shippingMethod', value)}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">Standard Shipping</div>
                            <div className="text-sm text-gray-600">5-7 business days</div>
                          </div>
                          <div className="font-medium">$10.00</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express" className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">Express Shipping</div>
                            <div className="text-sm text-gray-600">2-3 business days</div>
                          </div>
                          <div className="font-medium">$25.00</div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-4 border rounded-lg">
                      <RadioGroupItem value="overnight" id="overnight" />
                      <Label htmlFor="overnight" className="flex-1 cursor-pointer">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">Overnight Shipping</div>
                            <div className="text-sm text-gray-600">Next business day</div>
                          </div>
                          <div className="font-medium">$50.00</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex space-x-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setCurrentStep(3)}
                    >
                      Continue to payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 1234 1234 1234"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nameOnCard">Name on card</Label>
                    <Input
                      id="nameOnCard"
                      value={formData.nameOnCard}
                      onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="billingAddressSame"
                      checked={formData.billingAddressSame}
                      onCheckedChange={(checked) => 
                        handleInputChange('billingAddressSame', checked as boolean)
                      }
                    />
                    <Label htmlFor="billingAddressSame">
                      Billing address is the same as shipping address
                    </Label>
                  </div>

                  <div className="flex space-x-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setCurrentStep(2)}
                    >
                      Back
                    </Button>
                    <Button className="flex-1">
                      Complete order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.variant} × {item.quantity}
                      </div>
                    </div>
                    <div className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
