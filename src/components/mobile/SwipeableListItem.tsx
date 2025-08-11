import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: 'red' | 'blue' | 'green' | 'gray';
  onClick: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  actions?: SwipeAction[];
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  actions,
  onEdit,
  onDelete,
  disabled = false
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [actionWidth, setActionWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);

  // Default actions if not provided
  const defaultActions: SwipeAction[] = [];
  if (onEdit) {
    defaultActions.push({
      icon: <Edit className="h-4 w-4" />,
      label: 'Edit',
      color: 'blue',
      onClick: onEdit
    });
  }
  if (onDelete) {
    defaultActions.push({
      icon: <Trash2 className="h-4 w-4" />,
      label: 'Delete',
      color: 'red',
      onClick: onDelete
    });
  }

  const swipeActions = actions || defaultActions;

  useEffect(() => {
    if (actionsRef.current) {
      setActionWidth(actionsRef.current.offsetWidth);
    }
  }, [swipeActions]);

  const getActionColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'blue':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'green':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || swipeActions.length === 0) return;
    
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    lastX.current = startX.current;
    setIsActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    const maxSwipe = Math.min(actionWidth, 120); // Max swipe distance

    if (diff > 0) {
      // Swiping left to reveal actions
      const newOffset = Math.min(diff, maxSwipe);
      setSwipeOffset(newOffset);
    } else if (swipeOffset > 0) {
      // Swiping right to close
      const newOffset = Math.max(0, swipeOffset + (currentX - lastX.current));
      setSwipeOffset(newOffset);
    }

    lastX.current = currentX;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || disabled) return;

    isDragging.current = false;
    setIsActive(false);

    // Determine whether to snap open or closed
    const threshold = actionWidth * 0.3;
    if (swipeOffset > threshold) {
      setSwipeOffset(Math.min(actionWidth, 120));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || swipeActions.length === 0) return;
    
    isDragging.current = true;
    startX.current = e.clientX;
    lastX.current = startX.current;
    setIsActive(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const currentX = e.clientX;
      const diff = startX.current - currentX;
      const maxSwipe = Math.min(actionWidth, 120);

      if (diff > 0) {
        const newOffset = Math.min(diff, maxSwipe);
        setSwipeOffset(newOffset);
      } else if (swipeOffset > 0) {
        const newOffset = Math.max(0, swipeOffset + (currentX - lastX.current));
        setSwipeOffset(newOffset);
      }

      lastX.current = currentX;
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;

      isDragging.current = false;
      setIsActive(false);

      const threshold = actionWidth * 0.3;
      if (swipeOffset > threshold) {
        setSwipeOffset(Math.min(actionWidth, 120));
      } else {
        setSwipeOffset(0);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const closeSwipe = () => {
    setSwipeOffset(0);
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeSwipe();
      }
    };

    if (swipeOffset > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [swipeOffset]);

  if (disabled || swipeActions.length === 0) {
    return <div>{children}</div>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Actions Panel */}
      <div
        ref={actionsRef}
        className="absolute right-0 top-0 h-full flex items-stretch"
        style={{ transform: `translateX(${100 - (swipeOffset / Math.min(actionWidth, 120)) * 100}%)` }}
      >
        {swipeActions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={`h-full rounded-none px-4 flex flex-col items-center justify-center gap-1 min-w-[60px] ${getActionColor(action.color)}`}
            onClick={() => {
              action.onClick();
              closeSwipe();
            }}
          >
            {action.icon}
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div
        className={`transition-transform duration-200 ease-out ${isActive ? 'transition-none' : ''} bg-background`}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableListItem;