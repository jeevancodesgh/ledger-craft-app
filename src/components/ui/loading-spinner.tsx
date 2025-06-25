import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'primary' | 'accent';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent'
  };

  return (
    <div className={cn("relative", className)}>
      <Loader2 
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          "transition-all duration-300"
        )} 
      />
      
      {/* Pulsing background circle */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full animate-ping opacity-20",
          sizeClasses[size],
          variant === 'primary' && "bg-primary",
          variant === 'accent' && "bg-accent", 
          variant === 'default' && "bg-muted-foreground"
        )}
      />
    </div>
  );
};

interface PulsingDotsProps {
  className?: string;
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

interface BouncingDotsProps {
  className?: string;
}

export const BouncingDots: React.FC<BouncingDotsProps> = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-muted rounded animate-pulse"
          style={{
            animationDelay: `${index * 100}ms`,
            width: index === lines - 1 ? '75%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  animated = true
}) => {
  return (
    <div className={cn("w-full bg-muted rounded-full h-2 overflow-hidden", className)}>
      <div
        className={cn(
          "h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out",
          animated && "animate-pulse"
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};