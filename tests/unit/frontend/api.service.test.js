/**
 * Unit tests for API service
 */

import axios from 'axios';
import {
  getAssets,
  getAssetById,
  getAssetByAssetId,
  searchAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  generateQRCode,
  getDashboardStats,
  exportToCSV,
  advancedSearch,
  createBackup,
  checkHealth,
  checkDatabase
} from '../../../src/frontend/services/api';

// Mock axios
jest.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssets', () => {
    it('should fetch assets with default pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
          pagination: { page: 1, limit: 10 }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getAssets();

      expect(axios.get).toHaveBeenCalledWith('/api/assets', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch assets with custom pagination', async () => {
      const mockResponse = { data: { success: true } };
      axios.get.mockResolvedValue(mockResponse);

      await getAssets(2, 20);

      expect(axios.get).toHaveBeenCalledWith('/api/assets', {
        params: { page: 2, limit: 20 }
      });
    });
  });

  describe('getAssetById', () => {
    it('should fetch asset by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, asset_id: 'AST-2025-0001' }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getAssetById(1);

      expect(axios.get).toHaveBeenCalledWith('/api/assets/1');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAssetByAssetId', () => {
    it('should fetch asset by asset_id', async () => {
      const mockResponse = { data: { success: true } };
      axios.get.mockResolvedValue(mockResponse);

      await getAssetByAssetId('AST-2025-0001');

      expect(axios.get).toHaveBeenCalledWith('/api/assets/qr/AST-2025-0001');
    });
  });

  describe('searchAssets', () => {
    it('should search assets by term', async () => {
      const mockResponse = { data: { success: true, data: [] } };
      axios.get.mockResolvedValue(mockResponse);

      await searchAssets('laptop');

      expect(axios.get).toHaveBeenCalledWith('/api/assets/search', {
        params: { q: 'laptop' }
      });
    });
  });

  describe('createAsset', () => {
    it('should create new asset', async () => {
      const assetData = {
        description: 'Test Asset',
        responsible: 'John Doe',
        location: 'Office'
      };

      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, ...assetData }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await createAsset(assetData);

      expect(axios.post).toHaveBeenCalledWith('/api/assets', assetData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateAsset', () => {
    it('should update existing asset', async () => {
      const updates = { description: 'Updated' };
      const mockResponse = { data: { success: true } };

      axios.put.mockResolvedValue(mockResponse);

      await updateAsset(1, updates);

      expect(axios.put).toHaveBeenCalledWith('/api/assets/1', updates);
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset', async () => {
      const mockResponse = { data: { success: true } };
      axios.delete.mockResolvedValue(mockResponse);

      await deleteAsset(1);

      expect(axios.delete).toHaveBeenCalledWith('/api/assets/1');
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code for asset', async () => {
      const mockResponse = {
        data: {
          success: true,
          qr: { dataURL: 'data:image/png;base64,test' }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      await generateQRCode(1);

      expect(axios.post).toHaveBeenCalledWith('/api/assets/1/generate-qr');
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      const mockResponse = {
        data: {
          success: true,
          stats: { total: 150 }
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getDashboardStats();

      expect(axios.get).toHaveBeenCalledWith('/api/assets/stats/dashboard');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('exportToCSV', () => {
    it('should download CSV file', async () => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      const mockResponse = {
        data: mockBlob,
        headers: {
          'content-disposition': 'attachment; filename="test.csv"'
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      // Mock DOM APIs
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      global.URL.revokeObjectURL = jest.fn();
      document.body.appendChild = jest.fn();
      const mockLink = {
        click: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn()
      };
      document.createElement = jest.fn(() => mockLink);

      const result = await exportToCSV();

      expect(axios.get).toHaveBeenCalledWith('/api/assets/export/csv', {
        responseType: 'blob'
      });
      expect(result.success).toBe(true);
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('advancedSearch', () => {
    it('should perform advanced search', async () => {
      const filters = {
        location: 'Office',
        responsible: 'John'
      };

      const mockResponse = { data: { success: true, data: [] } };
      axios.post.mockResolvedValue(mockResponse);

      await advancedSearch(filters);

      expect(axios.post).toHaveBeenCalledWith(
        '/api/assets/search/advanced',
        filters
      );
    });
  });

  describe('createBackup', () => {
    it('should create database backup', async () => {
      const mockResponse = {
        data: {
          success: true,
          backup: { filename: 'backup.sql' }
        }
      };

      axios.post.mockResolvedValue(mockResponse);

      const result = await createBackup();

      expect(axios.post).toHaveBeenCalledWith('/api/db-backup');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('checkHealth', () => {
    it('should check backend health', async () => {
      const mockResponse = {
        data: { success: true, status: 'ok' }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await checkHealth();

      expect(axios.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('checkDatabase', () => {
    it('should check database connection', async () => {
      const mockResponse = {
        data: { success: true, status: 'ok' }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await checkDatabase();

      expect(axios.get).toHaveBeenCalledWith('/api/db-test');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    it('should throw error on failed request', async () => {
      const errorMessage = 'Network Error';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(getAssets()).rejects.toThrow(errorMessage);
    });

    it('should handle 404 errors', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' }
        }
      };

      axios.get.mockRejectedValue(error);

      await expect(getAssetById(999)).rejects.toEqual(error);
    });
  });
});
