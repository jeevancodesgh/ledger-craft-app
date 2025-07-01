import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  FileText, 
  Receipt, 
  DollarSign, 
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxActivity {
  id: string;
  type: 'invoice' | 'expense' | 'payment' | 'return';
  description: string;
  amount: number;
  date: string;
  status?: string;
}

interface RecentTaxActivityProps {
  activities: TaxActivity[];
  className?: string;
}

export const RecentTaxActivity: React.FC<RecentTaxActivityProps> = ({
  activities,
  className
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'expense': return <Receipt className="h-4 w-4 text-amber-600" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'return': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'text-blue-600';
      case 'expense': return 'text-amber-600';
      case 'payment': return 'text-green-600';
      case 'return': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'invoice': return { variant: 'default' as const, text: 'Invoice' };
      case 'expense': return { variant: 'warning' as const, text: 'Expense' };
      case 'payment': return { variant: 'success' as const, text: 'Payment' };
      case 'return': return { variant: 'secondary' as const, text: 'Return' };
      default: return { variant: 'outline' as const, text: 'Activity' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatAmount = (amount: number, type: string) => {
    const isExpense = type === 'expense';
    const prefix = isExpense ? '-' : '+';
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  // Calculate summary stats
  const totalTaxCollected = activities
    .filter(a => a.type === 'invoice')
    .reduce((sum, a) => sum + a.amount, 0);
    
  const totalTaxPaid = activities
    .filter(a => a.type === 'expense')
    .reduce((sum, a) => sum + a.amount, 0);

  const netPosition = totalTaxCollected - totalTaxPaid;

  if (activities.length === 0) {
    return (
      <Card className={cn('recent-activity-card', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium">Recent Tax Activity</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <div className="text-sm font-medium text-muted-foreground">
              No recent tax activity
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Start by creating invoices or recording expenses
            </div>
            <Button size="sm" variant="outline" className="mt-4">
              Add Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('recent-activity-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium">Recent Tax Activity</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="space-y-1">
              <div className="text-muted-foreground">GST Collected</div>
              <div className="font-semibold text-green-600">
                +${totalTaxCollected.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">GST Paid</div>
              <div className="font-semibold text-amber-600">
                -${totalTaxPaid.toFixed(2)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Net Position</div>
              <div className={cn(
                "font-semibold",
                netPosition > 0 ? "text-red-600" : "text-green-600"
              )}>
                {netPosition > 0 ? '+' : ''}${netPosition.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t"></div>

          {/* Activity List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                Recent Transactions
              </span>
              <span className="text-xs text-muted-foreground">
                Last 30 days
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activities.map((activity) => {
                const badge = getActivityBadge(activity.type);
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={badge.variant} className="text-xs px-1 py-0">
                          {badge.text}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(activity.date)}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium truncate">
                        {activity.description}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <div className={cn(
                        "text-sm font-semibold",
                        getActivityColor(activity.type)
                      )}>
                        {formatAmount(activity.amount, activity.type)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        GST
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <Button size="sm" variant="outline" className="w-full">
              View All Tax Transactions
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {/* Quick Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xs space-y-1">
              <div className="font-medium text-blue-800 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Activity Insight
              </div>
              <div className="text-blue-700">
                {activities.filter(a => a.type === 'invoice').length > 
                 activities.filter(a => a.type === 'expense').length ? (
                  'Strong sales activity this period. Ensure all invoices include correct GST.'
                ) : activities.filter(a => a.type === 'expense').length > 
                   activities.filter(a => a.type === 'invoice').length ? (
                  'High expense activity. Keep receipts organized for GST claims.'
                ) : (
                  'Balanced activity between sales and expenses. Good business health indicator.'
                )}
              </div>
            </div>
          </div>

          {/* Performance Indicator */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Tax Activity Score:
            </span>
            <div className="flex items-center gap-1">
              {activities.length >= 10 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium">Active</span>
                </>
              ) : activities.length >= 5 ? (
                <>
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-600 font-medium">Moderate</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600 font-medium">Low Activity</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};