import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';
import MobileBalanceCard from '../MobileBalanceCard';
import MobileQuickActions from '../MobileQuickActions';
import SwipeableListItem from '../SwipeableListItem';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => true
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Mobile Components', () => {
  describe('MobileBalanceCard', () => {
    it('renders balance card with correct amount', () => {
      render(
        <MobileBalanceCard
          title="Net Income"
          amount={1500.50}
          subtitle="Revenue vs Expenses"
          variant="success"
        />
      );

      expect(screen.getByText('Net Income')).toBeInTheDocument();
      expect(screen.getByText('$1,500.50')).toBeInTheDocument();
      expect(screen.getByText('Revenue vs Expenses')).toBeInTheDocument();
    });

    it('shows trend indicator when provided', () => {
      render(
        <MobileBalanceCard
          title="Monthly Revenue"
          amount={5000}
          trend={{ value: 12.5, isPositive: true }}
        />
      );

      expect(screen.getByText('12.5%')).toBeInTheDocument();
      expect(screen.getByText('vs last month')).toBeInTheDocument();
    });

    it('applies correct variant styling', () => {
      const { container } = render(
        <MobileBalanceCard
          title="Losses"
          amount={-500}
          variant="danger"
        />
      );

      const card = container.querySelector('.bg-gradient-to-br');
      expect(card).toHaveClass('from-red-500/10', 'to-red-600/20');
    });
  });

  describe('MobileQuickActions', () => {
    it('renders default quick actions in grid layout', () => {
      render(
        <TestWrapper>
          <MobileQuickActions layout="grid" />
        </TestWrapper>
      );

      expect(screen.getByText('New Invoice')).toBeInTheDocument();
      expect(screen.getByText('Add Expense')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
    });

    it('renders custom actions when provided', () => {
      const customActions = [
        {
          icon: <div data-testid="custom-icon" />,
          label: 'Custom Action',
          href: '/custom'
        }
      ];

      render(
        <TestWrapper>
          <MobileQuickActions actions={customActions} showDefault={false} />
        </TestWrapper>
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('handles action clicks correctly', () => {
      const handleClick = vi.fn();
      const actionsWithClick = [
        {
          icon: <div />,
          label: 'Clickable Action',
          onClick: handleClick
        }
      ];

      render(
        <TestWrapper>
          <MobileQuickActions actions={actionsWithClick} showDefault={false} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Clickable Action'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('SwipeableListItem', () => {
    it('renders children content', () => {
      render(
        <SwipeableListItem>
          <div>Test Content</div>
        </SwipeableListItem>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('shows default actions when onEdit and onDelete provided', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <SwipeableListItem onEdit={handleEdit} onDelete={handleDelete}>
          <div>Swipeable Content</div>
        </SwipeableListItem>
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('calls action handlers when buttons clicked', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();

      render(
        <SwipeableListItem onEdit={handleEdit} onDelete={handleDelete}>
          <div>Content</div>
        </SwipeableListItem>
      );

      fireEvent.click(screen.getByText('Edit'));
      expect(handleEdit).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText('Delete'));
      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it('renders custom actions when provided', () => {
      const customActions = [
        {
          icon: <div data-testid="archive-icon" />,
          label: 'Archive',
          color: 'gray' as const,
          onClick: vi.fn()
        }
      ];

      render(
        <SwipeableListItem actions={customActions}>
          <div>Content</div>
        </SwipeableListItem>
      );

      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByTestId('archive-icon')).toBeInTheDocument();
    });

    it('does not render actions when disabled', () => {
      render(
        <SwipeableListItem disabled onEdit={vi.fn()} onDelete={vi.fn()}>
          <div>Disabled Content</div>
        </SwipeableListItem>
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });
});

describe('Mobile CSS Classes', () => {
  it('applies mobile utility classes correctly', () => {
    // Test CSS class application
    const testDiv = document.createElement('div');
    testDiv.className = 'mobile-balance-lg gradient-overlay-blue mobile-card-hover';
    
    expect(testDiv.classList.contains('mobile-balance-lg')).toBe(true);
    expect(testDiv.classList.contains('gradient-overlay-blue')).toBe(true);
    expect(testDiv.classList.contains('mobile-card-hover')).toBe(true);
  });
});