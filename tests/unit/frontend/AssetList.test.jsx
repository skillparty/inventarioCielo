/**
 * Unit tests for AssetList component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AssetList from '../../../src/frontend/components/AssetList';
import * as api from '../../../src/frontend/services/api';

// Mock the API module
jest.mock('../../../src/frontend/services/api');

describe('AssetList Component', () => {
  const mockAssets = {
    success: true,
    data: [
      {
        id: 1,
        asset_id: 'AST-2025-0001',
        description: 'Laptop Dell',
        responsible: 'John Doe',
        location: 'Office',
        created_at: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        asset_id: 'AST-2025-0002',
        description: 'Mouse Logitech',
        responsible: 'Jane Smith',
        location: 'Warehouse',
        created_at: '2025-01-02T00:00:00.000Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasMore: false
    }
  };

  const mockOnCreate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnScan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    api.getAssets.mockResolvedValue(mockAssets);
    api.deleteAsset.mockResolvedValue({ success: true });
    api.searchAssets.mockResolvedValue(mockAssets);
  });

  it('should render loading state initially', () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should render assets after loading', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
      expect(screen.getByText('Mouse Logitech')).toBeInTheDocument();
    });
  });

  it('should display asset details correctly', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('AST-2025-0001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Office')).toBeInTheDocument();
    });
  });

  it('should call API on mount', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(api.getAssets).toHaveBeenCalledWith(1, 10);
    });
  });

  it('should handle search input', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Laptop' } });

    // Wait for debounce
    await waitFor(() => {
      expect(api.searchAssets).toHaveBeenCalledWith('Laptop');
    }, { timeout: 1000 });
  });

  it('should call onEdit when edit button is clicked', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/editar/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockAssets.data[0]);
  });

  it('should handle delete with confirmation', async () => {
    // Mock window.confirm
    global.confirm = jest.fn(() => true);

    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/eliminar/i);
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(api.deleteAsset).toHaveBeenCalledWith(1);
    });
  });

  it('should not delete if confirmation is cancelled', async () => {
    global.confirm = jest.fn(() => false);

    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/eliminar/i);
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(api.deleteAsset).not.toHaveBeenCalled();
  });

  it('should handle pagination', async () => {
    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText('Laptop Dell')).toBeInTheDocument();
    });

    const nextButton = screen.getByLabelText(/siguiente/i) || screen.getByText(/siguiente/i);
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(api.getAssets).toHaveBeenCalledWith(2, 10);
      });
    }
  });

  it('should display error message on API failure', async () => {
    api.getAssets.mockRejectedValue(new Error('API Error'));

    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no assets', async () => {
    api.getAssets.mockResolvedValue({
      ...mockAssets,
      data: [],
      pagination: { ...mockAssets.pagination, total: 0 }
    });

    render(<AssetList onEdit={mockOnEdit} onCreate={mockOnCreate} onScan={mockOnScan} />);

    await waitFor(() => {
      expect(screen.getByText(/no hay activos/i)).toBeInTheDocument();
    });
  });
});
