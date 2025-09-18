/**
 * Reusable Loading Screen Component
 * Provides consistent loading UI across the application
 */

import React from 'react';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const spinnerSizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-8">
        <div className={`${sizeClasses[size]} mx-auto bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center`}>
          <div className={`${spinnerSizeClasses[size]} border-primary/30 border-t-primary rounded-full animate-spin`}></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          <p className="text-muted-foreground">Please wait while we prepare everything for you...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
