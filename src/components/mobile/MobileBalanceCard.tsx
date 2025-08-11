import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/invoiceUtils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MobileBalanceCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

const MobileBalanceCard: React.FC<MobileBalanceCardProps> = ({
  title,
  amount,
  subtitle,
  trend,
  variant = 'primary',
  icon
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border-emerald-200/50 dark:border-emerald-500/30';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500/10 to-amber-600/20 border-amber-200/50 dark:border-amber-500/30';
      case 'danger':
        return 'bg-gradient-to-br from-red-500/10 to-red-600/20 border-red-200/50 dark:border-red-500/30';
      default:
        return 'bg-gradient-to-br from-blue-500/10 to-indigo-600/20 border-blue-200/50 dark:border-blue-500/30';
    }
  };

  const getAmountColor = () => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      default:
        return amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground';
    }
  };

  return (
    <Card className={`${getVariantStyles()} transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
          {icon && (
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className={`text-3xl font-bold tracking-tight ${getAmountColor()}`}>
            {formatCurrency(amount)}
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 text-sm">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={trend.isPositive ? 'text-emerald-600' : 'text-red-600'}>
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">
                vs last month
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileBalanceCard;