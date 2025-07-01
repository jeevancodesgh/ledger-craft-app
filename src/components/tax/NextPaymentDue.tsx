import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentDue {
  date: string;
  amount: number;
  type: 'GST' | 'Income_Tax';
}

interface NextPaymentDueProps {
  paymentDue: PaymentDue | null;
  className?: string;
}

export const NextPaymentDue: React.FC<NextPaymentDueProps> = ({
  paymentDue,
  className
}) => {
  if (!paymentDue) {
    return (
      <Card className={cn('next-payment-card', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-center h-16">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                No Payments Due
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up with tax payments
              </p>
            </div>

            <Badge variant="success" className="w-full justify-center">
              Up to Date
            </Badge>

            <Button size="sm" variant="outline" className="w-full">
              View Tax Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dueDate = new Date(paymentDue.date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const getUrgencyLevel = () => {
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 7) return 'urgent';
    if (daysUntilDue <= 14) return 'warning';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'overdue': return 'text-red-600';
      case 'urgent': return 'text-orange-600';
      case 'warning': return 'text-amber-600';
      default: return 'text-blue-600';
    }
  };

  const getUrgencyBadge = () => {
    switch (urgencyLevel) {
      case 'overdue': return { variant: 'destructive' as const, text: 'OVERDUE' };
      case 'urgent': return { variant: 'destructive' as const, text: 'DUE SOON' };
      case 'warning': return { variant: 'warning' as const, text: 'DUE SOON' };
      default: return { variant: 'secondary' as const, text: 'UPCOMING' };
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-NZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysText = () => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `${daysUntilDue} days remaining`;
  };

  const badge = getUrgencyBadge();

  return (
    <Card className={cn('next-payment-card relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Due Date Display */}
          <div className="space-y-1">
            <div className={cn("text-2xl font-bold", getUrgencyColor())}>
              {formatDate(dueDate)}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {getDaysText()}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount Due:</span>
              <span className="text-lg font-semibold">
                ${paymentDue.amount.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Type:</span>
              <span className="text-sm">
                {paymentDue.type === 'GST' ? 'GST Return' : 'Income Tax'}
              </span>
            </div>
          </div>

          {/* Urgency Badge */}
          <Badge variant={badge.variant} className="w-full justify-center">
            {urgencyLevel === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
            {badge.text}
          </Badge>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              size="sm" 
              className="w-full"
              variant={urgencyLevel === 'overdue' ? 'destructive' : 'default'}
            >
              {paymentDue.type === 'GST' ? 'Prepare GST Return' : 'Prepare Tax Return'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button size="sm" variant="outline" className="w-full">
              Set Payment Reminder
            </Button>
          </div>

          {/* Additional Info */}
          {urgencyLevel === 'overdue' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div className="text-xs text-red-700">
                  <div className="font-medium">Overdue Payment</div>
                  <div>Late filing penalties may apply. Submit immediately.</div>
                </div>
              </div>
            </div>
          )}

          {urgencyLevel === 'urgent' && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
              <div className="text-xs text-orange-700">
                <div className="font-medium">Urgent Action Required</div>
                <div>Submit your return soon to avoid late penalties.</div>
              </div>
            </div>
          )}

          {urgencyLevel === 'normal' && paymentDue.amount > 5000 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
              <div className="text-xs text-blue-700">
                <div className="font-medium">Large Payment Due</div>
                <div>Consider setting aside funds now to ensure you can meet this obligation.</div>
              </div>
            </div>
          )}

          {/* IRD Contact Info for Overdue */}
          {urgencyLevel === 'overdue' && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <div>IRD Contact: 0800 377 774</div>
              <div>Online: myir.ird.govt.nz</div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Urgency indicator line */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          urgencyLevel === 'overdue' ? "bg-red-500" :
          urgencyLevel === 'urgent' ? "bg-orange-500" :
          urgencyLevel === 'warning' ? "bg-amber-500" : "bg-blue-500"
        )}
      />
    </Card>
  );
};