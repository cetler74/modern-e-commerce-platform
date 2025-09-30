import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function Addresses() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const { getBackend } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => getBackend().users.getAddresses(),
  });

  const saveAddress = useMutation({
    mutationFn: (data: typeof formData) =>
      editingId
        ? getBackend().users.updateAddress({ id: editingId, ...data })
        : getBackend().users.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      resetForm();
      toast({
        title: 'Success',
        description: editingId ? 'Address updated successfully' : 'Address added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save address',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const deleteAddress = useMutation({
    mutationFn: (addressId: string) =>
      getBackend().users.deleteAddress({ id: addressId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const setDefaultAddress = useMutation({
    mutationFn: (addressId: string) =>
      getBackend().users.setDefaultAddress({ id: addressId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({
        title: 'Success',
        description: 'Default address updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update default address',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      label: '',
      firstName: '',
      lastName: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    });
    setEditingId(address.id);
    setIsEditing(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    saveAddress.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Addresses</h1>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Add/Edit Address Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Address' : 'Add New Address'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update your address information' : 'Add a new delivery address'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label">Address Label</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleInputChange('label', e.target.value)}
                  placeholder="e.g., Home, Work, etc."
                />
              </div>
              <div></div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="12345"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4 border-t">
              <Button onClick={handleSave} disabled={saveAddress.isPending}>
                {editingId ? 'Update Address' : 'Add Address'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      <div className="grid gap-4 md:grid-cols-2">
        {addresses && addresses.length > 0 ? (
          addresses.map((address: Address) => (
            <Card key={address.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <CardTitle className="text-lg">{address.label}</CardTitle>
                    {address.isDefault && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this address?')) {
                          deleteAddress.mutate(address.id);
                        }
                      }}
                      disabled={deleteAddress.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">
                    {address.firstName} {address.lastName}
                  </div>
                  <div>{address.street}</div>
                  <div>
                    {address.city}, {address.state} {address.zipCode}
                  </div>
                  <div>{address.country}</div>
                </div>
                
                {!address.isDefault && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAddress.mutate(address.id)}
                      disabled={setDefaultAddress.isPending}
                    >
                      Set as Default
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">No addresses found</div>
              <p className="text-sm text-gray-400 mb-6">
                Add delivery addresses to make checkout faster
              </p>
              <Button onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}