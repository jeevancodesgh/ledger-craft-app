import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Users, Calendar, CreditCard, FileText, Target, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
  priority?: 'high' | 'medium' | 'low';
  description?: string;
  badgeCount?: number;
  iconColor?: string;
}

interface MobileQuickActionsProps {
  actions?: QuickAction[];
  layout?: 'grid' | 'carousel' | 'smart';
  showDefault?: boolean;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  actions,
  layout = 'smart',
  showDefault = true
}) => {
  const defaultActions: QuickAction[] = [
    {
      icon: <Plus className="h-7 w-7" />,
      label: 'New Invoice',
      href: '/invoices/create',
      variant: 'primary',
      priority: 'high',
      description: 'Create new invoice',
      iconColor: 'text-white'
    },
    {
      icon: <Receipt className="h-6 w-6" />,
      label: 'Add Expense',
      href: '/expenses',
      variant: 'accent',
      priority: 'high',
      description: 'Track expenses',
      iconColor: 'text-emerald-600'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Customers',
      href: '/customers',
      priority: 'medium',
      iconColor: 'text-blue-600'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Payments',
      href: '/payments',
      priority: 'medium',
      iconColor: 'text-purple-600'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'Reports',
      href: '/financial-reports',
      priority: 'low',
      iconColor: 'text-amber-600'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Analytics',
      href: '/dashboard',
      priority: 'low',
      iconColor: 'text-indigo-600'
    }
  ];

  const quickActions = showDefault ? [...defaultActions, ...(actions || [])] : (actions || defaultActions);

  const ActionButton: React.FC<{ action: QuickAction; index: number; isLarge?: boolean }> = ({ 
    action, 
    index, 
    isLarge = false 
  }) => {
    const buttonContent = (
      <Button
        variant={action.variant === 'primary' ? 'default' : 'outline'}
        className={cn(
          'relative overflow-hidden transition-all duration-200 active:scale-95',
          'group hover:shadow-lg hover:-translate-y-0.5',
          // Size variations
          isLarge ? 'h-24 flex-col gap-3 p-4' : 'h-20 flex-col gap-2 p-3',
          layout === 'carousel' && 'min-w-[90px] flex-shrink-0',
          layout === 'grid' && 'flex-1 min-w-0',
          layout === 'smart' && (action.priority === 'high' ? 'col-span-1' : 'flex-1'),
          // Variant styles
          action.variant === 'primary' && [
            'bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700',
            'hover:from-blue-500 hover:via-blue-600 hover:to-blue-700',
            'shadow-lg shadow-blue-600/25 border-0',
            'text-white'
          ],
          action.variant === 'accent' && [
            'bg-gradient-to-br from-emerald-50 to-emerald-100',
            'border-emerald-200 hover:border-emerald-300',
            'hover:from-emerald-100 hover:to-emerald-200',
            'shadow-sm hover:shadow-emerald-200/50'
          ],
          !action.variant && [
            'bg-gradient-to-br from-gray-50 to-white',
            'border-gray-200 hover:border-gray-300',
            'hover:from-gray-100 hover:to-gray-50',
            'shadow-sm hover:shadow-gray-200/50'
          ]
        )}
        disabled={action.disabled}
        onClick={action.onClick}
      >
        {/* Background decoration for primary actions */}
        {action.variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
        
        {/* Badge for notifications */}
        {action.badgeCount && action.badgeCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
            {action.badgeCount > 9 ? '9+' : action.badgeCount}
          </div>
        )}

        {/* Icon container */}
        <div className={cn(
          'relative rounded-full transition-all duration-200 group-hover:scale-110',
          action.variant === 'primary' ? 'bg-white/20 backdrop-blur-sm' : 'bg-transparent',
          isLarge ? 'p-3' : 'p-2'
        )}>
          <div className={cn(
            action.iconColor || (action.variant === 'primary' ? 'text-white' : 'text-gray-600')
          )}>
            {action.icon}
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center space-y-0.5">
          <span className={cn(
            'font-semibold text-center leading-tight',
            isLarge ? 'text-sm' : 'text-xs',
            action.variant === 'primary' ? 'text-white' : 'text-gray-900'
          )}>
            {action.label}
          </span>
          {action.description && isLarge && (
            <span className={cn(
              'text-xs text-center leading-tight opacity-70',
              action.variant === 'primary' ? 'text-white' : 'text-gray-600'
            )}>
              {action.description}
            </span>
          )}
        </div>

        {/* Priority indicator */}
        {action.priority === 'high' && action.variant !== 'primary' && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </Button>
    );

    if (action.href && !action.onClick) {
      return (
        <Link 
          key={index} 
          to={action.href} 
          className={cn(
            layout === 'carousel' && 'flex-shrink-0',
            layout === 'grid' && 'flex-1',
            layout === 'smart' && action.priority === 'high' && 'col-span-1'
          )}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <div 
        key={index} 
        className={cn(
          layout === 'carousel' && 'flex-shrink-0',
          layout === 'grid' && 'flex-1',
          layout === 'smart' && action.priority === 'high' && 'col-span-1'
        )}
      >
        {buttonContent}
      </div>
    );
  };

  // Smart layout: Primary actions get prominent placement
  if (layout === 'smart') {
    const primaryActions = quickActions.filter(action => action.priority === 'high');
    const secondaryActions = quickActions.filter(action => action.priority !== 'high');
    
    return (
      <div className="space-y-4">
        {/* Primary actions - hero section */}
        {primaryActions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {primaryActions.slice(0, 2).map((action, index) => (
              <ActionButton key={index} action={action} index={index} isLarge={true} />
            ))}
          </div>
        )}
        
        {/* Secondary actions - compact grid */}
        {secondaryActions.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Zap className="h-4 w-4" />
              <span className="font-medium">More Actions</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {secondaryActions.slice(0, 4).map((action, index) => (
                <ActionButton key={index + primaryActions.length} action={action} index={index + primaryActions.length} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Carousel layout
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

  // Traditional grid layout
  return (
    <div className="grid grid-cols-2 gap-3">
      {quickActions.slice(0, 6).map((action, index) => (
        <ActionButton key={index} action={action} index={index} />
      ))}
    </div>
  );
};

export default MobileQuickActions;