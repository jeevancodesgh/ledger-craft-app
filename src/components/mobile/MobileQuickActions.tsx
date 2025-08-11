import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Users, Calendar, CreditCard, FileText, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface MobileQuickActionsProps {
  actions?: QuickAction[];
  layout?: 'grid' | 'carousel';
  showDefault?: boolean;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  actions,
  layout = 'grid',
  showDefault = true
}) => {
  const defaultActions: QuickAction[] = [
    {
      icon: <Plus className="h-6 w-6" />,
      label: 'New Invoice',
      href: '/invoices/create',
      variant: 'primary'
    },
    {
      icon: <Receipt className="h-5 w-5" />,
      label: 'Add Expense',
      href: '/expenses'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Customers',
      href: '/customers'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Payments',
      href: '/payments'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Reports',
      href: '/financial-reports'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Analytics',
      href: '/dashboard'
    }
  ];

  const quickActions = showDefault ? [...defaultActions, ...(actions || [])] : (actions || defaultActions);

  const ActionButton: React.FC<{ action: QuickAction; index: number }> = ({ action, index }) => {
    const buttonContent = (
      <Button
        variant={action.variant === 'primary' ? 'default' : 'outline'}
        className={cn(
          'h-20 flex-col gap-2 flex-1 min-w-0',
          action.variant === 'primary' && 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg',
          layout === 'carousel' && 'min-w-[80px] flex-shrink-0'
        )}
        disabled={action.disabled}
        onClick={action.onClick}
      >
        <div className={cn(
          'p-2 rounded-full',
          action.variant === 'primary' ? 'bg-white/20' : 'bg-primary/10'
        )}>
          {action.icon}
        </div>
        <span className="text-xs font-medium text-center leading-tight">
          {action.label}
        </span>
      </Button>
    );

    if (action.href && !action.onClick) {
      return (
        <Link key={index} to={action.href} className={layout === 'carousel' ? 'flex-shrink-0' : 'flex-1'}>
          {buttonContent}
        </Link>
      );
    }

    return (
      <div key={index} className={layout === 'carousel' ? 'flex-shrink-0' : 'flex-1'}>
        {buttonContent}
      </div>
    );
  };

  if (layout === 'carousel') {
    return (
      <div className="w-full">
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide">
          {quickActions.map((action, index) => (
            <ActionButton key={index} action={action} index={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {quickActions.slice(0, 6).map((action, index) => (
        <ActionButton key={index} action={action} index={index} />
      ))}
    </div>
  );
};

export default MobileQuickActions;