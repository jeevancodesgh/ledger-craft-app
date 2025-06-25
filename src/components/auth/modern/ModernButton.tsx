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
      "inline-flex items-center justify-center font-medium transition-all duration-300 ease-out",
      "focus:outline-none focus:ring-2 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "relative overflow-hidden group transform-gpu", // Hardware acceleration
      "hover:scale-105 active:scale-95", // Scale animations
      "shadow-md hover:shadow-lg active:shadow-sm", // Shadow animations
      fullWidth && "w-full"
    );

    const variantClasses = {
      primary: cn(
        "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground",
        "hover:from-primary/90 hover:to-primary/80 hover:shadow-xl hover:shadow-primary/30",
        "focus:ring-primary/50 focus:shadow-primary/20",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:to-transparent",
        "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
        "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        "after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-500 after:ease-out"
      ),
      secondary: cn(
        "bg-secondary text-secondary-foreground border border-border",
        "hover:bg-secondary/80 hover:shadow-lg hover:border-border/80",
        "focus:ring-secondary/50",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent",
        "before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-500"
      ),
      outline: cn(
        "border border-border bg-background text-foreground",
        "hover:bg-muted hover:shadow-lg hover:border-primary/30",
        "focus:ring-primary/50",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-transparent",
        "before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-500"
      ),
      ghost: cn(
        "text-foreground hover:bg-muted hover:shadow-md",
        "focus:ring-primary/50",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-muted/50 before:to-transparent",
        "before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300"
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
            "flex-shrink-0 transition-transform duration-300 ease-out",
            "group-hover:scale-110 group-active:scale-95", // Icon animations
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "mr-2"
          )} />
        )}
        
        {loading && (
          <Loader2 className={cn(
            "animate-spin flex-shrink-0 transition-all duration-300",
            "animate-pulse", // Additional loading animation
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "mr-2"
          )} />
        )}

        {/* Button Text */}
        {children && (
          <span className="relative z-10 transition-all duration-300 ease-out group-hover:tracking-wide">
            {children}
          </span>
        )}

        {/* Right Icon */}
        {(Icon && iconPosition === 'right' && !loading) && (
          <Icon className={cn(
            "flex-shrink-0 transition-transform duration-300 ease-out",
            "group-hover:scale-110 group-active:scale-95 group-hover:translate-x-1", // Icon animations
            size === 'sm' ? "h-3 w-3" : "h-4 w-4",
            children && "ml-2"
          )} />
        )}

        {/* Enhanced Ripple Effect */}
        <span className="absolute inset-0 opacity-0 group-active:opacity-30 bg-white rounded-lg transition-all duration-200 ease-out group-active:scale-110" />
        
        {/* Glow Effect */}
        <span className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-r from-white via-white to-white rounded-lg blur-sm transition-opacity duration-500" />
      </button>
    );
  }
);

ModernButton.displayName = "ModernButton";

export { ModernButton };