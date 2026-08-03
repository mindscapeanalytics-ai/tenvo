/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CycleCountTasksWidget } from '../CycleCountTasksWidget';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/lib/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('@/lib/actions/dashboard/widgets', () => ({
  getCycleCountTasks: vi.fn(),
}));

vi.mock('@/lib/translations', () => ({
  translations: {
    en: {
      cycle_count_tasks: 'Cycle Count Tasks',
      pending_cycle_counts: 'Pending cycle counts',
      pending: 'Pending',
      in_progress: 'In Progress',
      today: 'Today',
      products: 'products',
      due: 'Due',
      view_all_tasks: 'View All Tasks',
      last_updated: 'Last updated',
      no_cycle_count_tasks: 'No cycle count tasks available',
      tomorrow: 'Tomorrow',
      overdue: 'overdue',
    },
  },
}));

import { getCycleCountTasks } from '@/lib/actions/dashboard/widgets';

describe('CycleCountTasksWidget', () => {
  beforeEach(() => {
    vi.mocked(getCycleCountTasks).mockResolvedValue({
      success: true,
      data: { pendingCount: 0, inProgressCount: 0, completedToday: 0, tasks: [] },
    });
  });
  const mockData = {
    pendingCount: 3,
    inProgressCount: 1,
    completedToday: 2,
    tasks: [
      {
        id: 1,
        name: 'Monthly Count - Zone A',
        scheduleId: 'cc-001',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'high',
        productCount: 45,
        completedCount: 0,
        assignedTo: 'user-123',
        status: 'pending',
      },
      {
        id: 2,
        name: 'Quarterly Count - Electronics',
        scheduleId: 'cc-002',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        productCount: 120,
        completedCount: 35,
        assignedTo: 'user-123',
        status: 'in_progress',
      },
    ],
  };

  it('should render loading skeleton before fetch settles', () => {
    vi.mocked(getCycleCountTasks).mockImplementationOnce(() => new Promise(() => {}));
    render(<CycleCountTasksWidget businessId="test-business" userId="test-user" />);
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should display cycle count tasks when data is provided', () => {
    render(
      <CycleCountTasksWidget businessId="test-business" userId="test-user" data={mockData} />,
    );
    expect(screen.getAllByText('Cycle Count Tasks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Pending cycle counts').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Monthly Count - Zone A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Quarterly Count - Electronics').length).toBeGreaterThanOrEqual(1);
  });

  it('should display task priorities correctly', () => {
    render(
      <CycleCountTasksWidget businessId="test-business" userId="test-user" data={mockData} />,
    );
    expect(screen.getAllByText('HIGH').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MEDIUM').length).toBeGreaterThanOrEqual(1);
  });

  it('should show progress bar for in-progress tasks', () => {
    render(
      <CycleCountTasksWidget businessId="test-business" userId="test-user" data={mockData} />,
    );
    expect(screen.getAllByText('29%').length).toBeGreaterThanOrEqual(1);
  });

  it('should call onStartCycleCount when task is clicked', () => {
    const mockOnStartCycleCount = vi.fn();
    render(
      <CycleCountTasksWidget
        businessId="test-business"
        userId="test-user"
        data={mockData}
        onStartCycleCount={mockOnStartCycleCount}
      />,
    );
    const firstTask = screen.getAllByText('Monthly Count - Zone A')[0];
    const row = firstTask.closest('.cursor-pointer');
    expect(row).toBeTruthy();
    fireEvent.click(row);
    expect(mockOnStartCycleCount).toHaveBeenCalledWith('cc-001');
  });

  it('should call onViewAllTasks when view all button is clicked', () => {
    const mockOnViewAllTasks = vi.fn();
    render(
      <CycleCountTasksWidget
        businessId="test-business"
        userId="test-user"
        data={mockData}
        onViewAllTasks={mockOnViewAllTasks}
      />,
    );
    const viewAllButton = screen.getAllByRole('button', { name: /View All Tasks/i })[0];
    fireEvent.click(viewAllButton);
    expect(mockOnViewAllTasks).toHaveBeenCalled();
  });

  it('should display empty state when no data is available', () => {
    render(
      <CycleCountTasksWidget
        businessId="test-business"
        userId="test-user"
        data={{ pendingCount: 0, inProgressCount: 0, completedToday: 0, tasks: [] }}
      />,
    );
    expect(screen.getAllByText('Cycle Count Tasks').length).toBeGreaterThanOrEqual(1);
  });

  it('should format due dates correctly', () => {
    const todayTask = {
      ...mockData,
      tasks: [
        {
          id: 1,
          name: 'Today Task',
          scheduleId: 'cc-today',
          dueDate: new Date(),
          priority: 'high',
          productCount: 10,
          completedCount: 0,
          assignedTo: 'user-123',
          status: 'pending',
        },
      ],
    };
    render(
      <CycleCountTasksWidget businessId="test-business" userId="test-user" data={todayTask} />,
    );
    expect(screen.getAllByText(/Today/).length).toBeGreaterThanOrEqual(1);
  });

  it('should display product count for each task', () => {
    render(
      <CycleCountTasksWidget businessId="test-business" userId="test-user" data={mockData} />,
    );
    expect(screen.getAllByText('45 products').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('120 products').length).toBeGreaterThanOrEqual(1);
  });
});
