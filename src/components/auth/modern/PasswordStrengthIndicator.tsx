import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: PasswordCriteria[] = [
  {
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8
  },
  {
    label: "Contains uppercase letter",
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    label: "Contains lowercase letter", 
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    label: "Contains number",
    test: (password: string) => /\d/.test(password)
  },
  {
    label: "Contains special character",
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
];

const calculateStrength = (password: string): { score: number; label: string; color: string } => {
  if (password.length === 0) {
    return { score: 0, label: "", color: "" };
  }

  const passedCriteria = criteria.filter(criterion => criterion.test(password)).length;
  
  if (passedCriteria <= 1) {
    return { score: 1, label: "Very Weak", color: "bg-red-500" };
  } else if (passedCriteria === 2) {
    return { score: 2, label: "Weak", color: "bg-orange-500" };
  } else if (passedCriteria === 3) {
    return { score: 3, label: "Fair", color: "bg-yellow-500" };
  } else if (passedCriteria === 4) {
    return { score: 4, label: "Good", color: "bg-blue-500" };
  } else {
    return { score: 5, label: "Strong", color: "bg-green-500" };
  }
};

export default function PasswordStrengthIndicator({ 
  password, 
  showCriteria = true 
}: PasswordStrengthIndicatorProps) {
  const strength = calculateStrength(password);
  const passedCriteria = criteria.map(criterion => criterion.test(password));

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Password strength</span>
          {strength.label && (
            <span className={cn(
              "text-xs font-medium",
              strength.score <= 2 ? "text-red-600 dark:text-red-400" :
              strength.score === 3 ? "text-yellow-600 dark:text-yellow-400" :
              strength.score === 4 ? "text-blue-600 dark:text-blue-400" :
              "text-green-600 dark:text-green-400"
            )}>
              {strength.label}
            </span>
          )}
        </div>
        
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-300",
                level <= strength.score
                  ? strength.color
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria Checklist */}
      {showCriteria && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Requirements:</span>
          <div className="grid grid-cols-1 gap-1">
            {criteria.map((criterion, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space-x-2 text-xs transition-colors duration-200",
                  passedCriteria[index] 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                  passedCriteria[index]
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-muted"
                )}>
                  {passedCriteria[index] ? (
                    <Check className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
                <span>{criterion.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}