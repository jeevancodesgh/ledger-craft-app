import React from 'react';
import { cn } from '../../lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className,
  delay = 0 
}) => {
  return (
    <div 
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out",
        "transform-gpu", // Hardware acceleration
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

interface StaggeredChildrenProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredChildren: React.FC<StaggeredChildrenProps> = ({
  children,
  staggerDelay = 100,
  className
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <PageTransition delay={index * staggerDelay}>
          {child}
        </PageTransition>
      ))}
    </div>
  );
};

interface SlideTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
  delay?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = 'right',
  className,
  delay = 0
}) => {
  const directionClasses = {
    left: 'slide-in-from-left-8',
    right: 'slide-in-from-right-8', 
    up: 'slide-in-from-top-8',
    down: 'slide-in-from-bottom-8'
  };

  return (
    <div
      className={cn(
        "animate-in fade-in duration-600 ease-out",
        directionClasses[direction],
        "transform-gpu", // Hardware acceleration
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

interface ScaleTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  className,
  delay = 0
}) => {
  return (
    <div
      className={cn(
        "animate-in fade-in scale-in duration-500 ease-out",
        "transform-gpu", // Hardware acceleration
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};