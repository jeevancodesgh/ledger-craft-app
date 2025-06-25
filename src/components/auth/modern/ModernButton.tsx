import React from 'react';
import { Loader2, LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    const baseClasses = cn(
      "inline-flex items-center justify-center font-medium transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "relative overflow-hidden group",
      fullWidth && "w-full"
    );

    const variantClasses = {
      primary: cn(
        "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
        "hover:from-primary/90 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25",
        "focus:ring-primary/50",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent",
        "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground border border-border",
        "hover:bg-secondary/80 hover:shadow-md",
        "focus:ring-secondary/50"
      ),
      outline: cn(
        "border border-border bg-background text-foreground",
        "hover:bg-muted hover:shadow-md",
        "focus:ring-primary/50"
      ),
      ghost: cn(
        "text-foreground hover:bg-muted",
        "focus:ring-primary/50"
      )
    };

    const sizeClasses = {
      sm: "px-3 py-2 text-sm rounded-md",
      md: "px-4 py-2.5 text-sm rounded-lg", 
      lg: "px-6 py-3 text-base rounded-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Left Icon or Loading Spinner */}
        {(Icon && iconPosition === 'left' && !loading) && (
          <Icon className={cn(
            "flex-shrink-0",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "mr-2"
          )} />
        )}
        
        {loading && (
          <Loader2 className={cn(
            "animate-spin flex-shrink-0",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "mr-2"
          )} />
        )}

        {/* Button Text */}
        {children && (
          <span className="relative z-10">
            {children}
          </span>
        )}

        {/* Right Icon */}
        {(Icon && iconPosition === 'right' && !loading) && (
          <Icon className={cn(
            "flex-shrink-0",
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "ml-2"
          )} />
        )}

        {/* Ripple Effect */}
        <span className="absolute inset-0 opacity-0 group-active:opacity-20 bg-white rounded-lg transition-opacity duration-150" />
      </button>
    );
  }
);

ModernButton.displayName = "ModernButton";

export { ModernButton };