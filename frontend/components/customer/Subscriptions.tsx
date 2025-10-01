import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pause, Play, Edit, Trash2, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

export default function Subscriptions() {
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionsResponse, isLoading } = useQuery({
    queryKey: ['customer-subscriptions'],
    queryFn: () => backend.subscriptions.list({}),
  });

  const subscriptions = subscriptionsResponse?.subscriptions || [];

  const pauseSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      backend.subscriptions.updateSubscription({ id: subscriptionId, action: 'pause' as const }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription paused successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to pause subscription',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const resumeSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      backend.subscriptions.updateSubscription({ id: subscriptionId, action: 'resume' as const }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription resumed successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to resume subscription',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: (subscriptionId: string) =>
      backend.subscriptions.updateSubscription({ id: subscriptionId, action: 'cancel' as const }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Every week';
      case 'monthly':
        return 'Every month';
      case 'quarterly':
        return 'Every 3 months';
      case 'annually':
        return 'Every year';
      default:
        return frequency;
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
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <Button>Browse Products</Button>
      </div>

      {/* Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptions?.filter(s => s.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $0.00
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {(() => {
                const activeSub = subscriptions?.find((s: any) => s.status === 'active');
                return activeSub?.nextBillingDate
                  ? new Date(activeSub.nextBillingDate).toLocaleDateString()
                  : 'No upcoming deliveries';
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions && subscriptions.length > 0 ? (
          subscriptions.map((subscription: any) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subscription.planName}</CardTitle>
                      <CardDescription>
                        Started {new Date(subscription.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">Active</div>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Subscription Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          Next billing: {subscription.status === 'active' && subscription.nextBillingDate
                            ? new Date(subscription.nextBillingDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Items: {subscription.items?.length || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Period:</strong>
                      </div>
                      <div className="text-sm">
                        {subscription.currentPeriodStart && new Date(subscription.currentPeriodStart).toLocaleDateString()} - {subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t">
                    {subscription.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => pauseSubscription.mutate(subscription.id)}
                        disabled={pauseSubscription.isPending}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : subscription.status === 'paused' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resumeSubscription.mutate(subscription.id)}
                        disabled={resumeSubscription.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    ) : null}
                    
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modify
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      Skip Next
                    </Button>
                    
                    {subscription.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this subscription?')) {
                            cancelSubscription.mutate(subscription.id);
                          }
                        }}
                        disabled={cancelSubscription.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel
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
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">No subscriptions found</div>
              <p className="text-sm text-gray-400 mb-6">
                Set up subscriptions to get your favorite products delivered regularly
              </p>
              <Button>Browse Products</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}