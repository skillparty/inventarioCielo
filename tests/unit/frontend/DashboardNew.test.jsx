/**
 * Unit tests for DashboardNew component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardNew from '../../../src/frontend/components/DashboardNew';
import * as api from '../../../src/frontend/services/api';

// Mock the API module
jest.mock('../../../src/frontend/services/api');

describe('DashboardNew Component', () => {
  const mockStats = {
    success: true,
    stats: {
      total: 150,
      thisWeek: 12,
      thisMonth: 45,
      byLocation: [
        { location: 'Oficina Principal', count: '75' },
        { location: 'Almacén', count: '30' }
      ],
      byResponsible: [
        { responsible: 'Juan Pérez', count: '25' },
        { responsible: 'María García', count: '20' }
      ],
      recent: [
        {
          id: 1,
          asset_id: 'AST-2025-0001',
          description: 'Laptop Dell',
          location: 'Office',
          responsible: 'John Doe',
          created_at: '2025-01-01T00:00:00.000Z'
        }
      ]
    }
  };

  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    api.getDashboardStats.mockResolvedValue(mockStats);
    api.exportToCSV.mockResolvedValue({ success: true, filename: 'test.csv' });
    api.createBackup.mockResolvedValue({
      success: true,
      backup: { filename: 'backup.sql', sizeFormatted: '150 KB' }
    });
  });

  it('should render loading state initially', () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText(/cargando estadísticas/i)).toBeInTheDocument();
  });

  it('should display stats after loading', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  it('should call API on mount', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(api.getDashboardStats).toHaveBeenCalled();
    });
  });

  it('should display location chart', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Oficina Principal')).toBeInTheDocument();
      expect(screen.getByText('Almacén')).toBeInTheDocument();
    });
  });

  it('should display top responsibles', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });
  });

  it('should display recent assets', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('AST-2025-0001')).toBeInTheDocument();
      expect(screen.getByText(/Laptop Dell/)).toBeInTheDocument();
    });
  });

  it('should handle refresh button click', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText(/actualizar/i);
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(api.getDashboardStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle export CSV action', async () => {
    // Mock window.alert
    global.alert = jest.fn();

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/exportar csv/i);
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(api.exportToCSV).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Exportado'));
    });
  });

  it('should handle backup action', async () => {
    global.alert = jest.fn();

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const backupButton = screen.getByText(/backup db/i);
    fireEvent.click(backupButton);

    await waitFor(() => {
      expect(api.createBackup).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Backup creado'));
    });
  });

  it('should navigate when action buttons are clicked', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const createButton = screen.getByText(/nuevo activo/i);
    fireEvent.click(createButton);

    expect(mockOnNavigate).toHaveBeenCalledWith('create');
  });

  it('should handle API errors gracefully', async () => {
    api.getDashboardStats.mockRejectedValue(new Error('API Error'));

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/error al cargar estadísticas/i)).toBeInTheDocument();
    });
  });

  it('should display retry button on error', async () => {
    api.getDashboardStats.mockRejectedValue(new Error('API Error'));

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      const retryButton = screen.getByText(/reintentar/i);
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('should retry loading stats on retry button click', async () => {
    api.getDashboardStats
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockStats);

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/reintentar/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('should handle empty stats data', async () => {
    api.getDashboardStats.mockResolvedValue({
      success: true,
      stats: {
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
        byLocation: [],
        byResponsible: [],
        recent: []
      }
    });

    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/no hay datos disponibles/i)).toBeInTheDocument();
    });
  });

  it('should disable action buttons while loading', async () => {
    render(<DashboardNew onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/exportar csv/i);
    fireEvent.click(exportButton);

    // Button should be disabled while exporting
    expect(exportButton).toHaveAttribute('disabled');
  });
});
